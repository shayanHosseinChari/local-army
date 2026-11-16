import { useCallback, useEffect, useRef, useState } from "react";

import {
  LanConnection,
  type LanMessage,
  type LanStatus,
} from "../network/LanConnection";

import {
  MATCH_PROTOCOL_VERSION,
  createMatchId,
  isMatchControlMessage,
  type MatchPhase,
  type MatchRole,
  type MatchSession,
} from "../protocol/matchProtocol";
import { isGameMessage, type GameMessage } from "../protocol/gameProtocol";

export type RoomStatus = LanStatus | "starting";

// هر دو گوشی باید این نسخهٔ جدید را داشته باشند.
const PROTOCOL_VERSION = 3;
const HANDSHAKE_TIMEOUT_MS = 8000;
const MATCH_LOAD_TIMEOUT_MS = 20000;

type RoomActions = {
  startHosting: () => void;
  joinRoom: (hostIp: string) => void;
  toggleReady: () => void;
  startMatch: () => void;
  markGameLoaded: (matchId: string) => void;
  leaveRoom: () => void;
  sendGameMessage: (message: GameMessage) => boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function useLanRoom() {
  const actionsRef = useRef<RoomActions | null>(null);
  const gameListenersRef = useRef(new Set<(message: GameMessage) => void>());

  const [status, setStatus] = useState<RoomStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<MatchRole | null>(null);
  const [peerVerified, setPeerVerified] = useState(false);
  const [guestReady, setGuestReady] = useState(false);

  const [matchPhase, setMatchPhase] = useState<MatchPhase>("lobby");
  const [matchSession, setMatchSession] = useState<MatchSession | null>(null);

  useEffect(() => {
    let active = true;
    let lastReceivedInput = 0;
    let lastReceivedSnapshot = 0;

    // وضعیت فوری پروتکل، مستقل از تأخیر render ری‌اکت.
    let currentStatus: LanStatus = "idle";
    let currentRole: MatchRole | null = null;
    let verified = false;
    let ready = false;
    let readyPending = false;

    let phase: MatchPhase = "lobby";
    let session: MatchSession | null = null;
    let localLoaded = false;
    let guestLoaded = false;
    let ended = false;
    let localRematch = false;
    let peerRematch = false;

    function tryRematch() {
      if (
        currentRole !== "host" ||
        !ended ||
        !localRematch ||
        !peerRematch ||
        phase !== "running"
      )
        return;
      const matchId = createMatchId();
      beginLoading({ matchId, role: "host" });
      send({
        type: "match/prepare",
        payload: { version: MATCH_PROTOCOL_VERSION, matchId },
      });
    }

    let handshakeTimer: ReturnType<typeof setTimeout> | null = null;
    let loadTimer: ReturnType<typeof setTimeout> | null = null;

    function clearHandshakeTimer() {
      if (handshakeTimer !== null) {
        clearTimeout(handshakeTimer);
        handshakeTimer = null;
      }
    }

    function clearLoadTimer() {
      if (loadTimer !== null) {
        clearTimeout(loadTimer);
        loadTimer = null;
      }
    }

    function changePhase(nextPhase: MatchPhase) {
      phase = nextPhase;

      if (active) {
        setMatchPhase(nextPhase);
      }
    }

    function resetLobby() {
      clearHandshakeTimer();
      clearLoadTimer();

      verified = false;
      ready = false;
      readyPending = false;
      session = null;
      localLoaded = false;
      guestLoaded = false;
      lastReceivedInput = 0;
      lastReceivedSnapshot = 0;

      phase = "lobby";

      if (active) {
        setPeerVerified(false);
        setGuestReady(false);
        setMatchSession(null);
        setMatchPhase("lobby");
      }
    }

    function stopRoom(message: string | null) {
      // قبل از stop پاک می‌کنیم تا حتی بدون callback قطع هم
      // وضعیت مسابقه و timerها باقی نمانند.
      resetLobby();
      currentRole = null;
      currentStatus = "idle";
      connection.stop();

      if (active) {
        setRole(null);
        setStatus("idle");
        setError(message);
      }
    }

    function verifyPeer() {
      clearHandshakeTimer();
      verified = true;
      setPeerVerified(true);
    }

    function send(message: LanMessage): boolean {
      if (connection.send(message)) {
        return true;
      }

      stopRoom("ارسال پیام ناموفق بود. دوباره به روم متصل شو.");
      return false;
    }

    function beginLoading(nextSession: MatchSession) {
      clearLoadTimer();

      session = nextSession;
      ended = false;
      localRematch = false;
      peerRematch = false;
      localLoaded = false;
      guestLoaded = false;
      lastReceivedInput = 0;
      lastReceivedSnapshot = 0;

      readyPending = false;

      setError(null);
      setMatchSession(nextSession);
      changePhase("loading");

      loadTimer = setTimeout(() => {
        if (
          active &&
          phase === "loading" &&
          session?.matchId === nextSession.matchId
        ) {
          stopRoom(
            "بارگذاری بازی در مهلت تعیین‌شده کامل نشد. دوباره روم بساز یا متصل شو.",
          );
        }
      }, MATCH_LOAD_TIMEOUT_MS);
    }

    function tryStartMatch() {
      if (
        currentRole !== "host" ||
        phase !== "loading" ||
        !session ||
        !localLoaded ||
        !guestLoaded
      ) {
        return;
      }

      if (
        !send({
          type: "match/start",
          payload: { matchId: session.matchId },
        })
      ) {
        return;
      }

      clearLoadTimer();
      changePhase("running");
    }

    function handleMessage(message: LanMessage) {
      if (!active) {
        return;
      }

      const payload = message.payload;
      if (message.type === "game/rematch") {
        if (
          !verified ||
          !isGameMessage(message) ||
          !session ||
          message.payload.matchId !== session.matchId ||
          phase !== "running" ||
          !ended
        )
          return;
        peerRematch = true;
        tryRematch();
        return;
      }
      if (message.type === "game/input" || message.type === "game/snapshot") {
        if (!verified || !isGameMessage(message)) {
          stopRoom("پیام بازی معتبر نیست.");
          return;
        }

        if (!session || message.payload.matchId !== session.matchId) {
          // پیام جلسهٔ قدیمی نباید روی جلسهٔ جدید اثر بگذارد.
          return;
        }

        if (phase !== "running") {
          return;
        }

        if (message.type === "game/input") {
          if (currentRole !== "host") {
            stopRoom("فقط میزبان می‌تواند ورودی مهمان را دریافت کند.");
            return;
          }

          if (message.payload.sequence <= lastReceivedInput) {
            return;
          }

          lastReceivedInput = message.payload.sequence;
        } else if (message.type === "game/snapshot") {
          if (currentRole !== "guest") {
            stopRoom("فقط مهمان می‌تواند وضعیت بازی را دریافت کند.");
            return;
          }

          if (message.payload.sequence <= lastReceivedSnapshot) {
            return;
          }

          lastReceivedSnapshot = message.payload.sequence;
          if (message.payload.players.some((player) => player.health <= 0))
            ended = true;
        }

        for (const listener of gameListenersRef.current) {
          try {
            listener(message);
          } catch {
            stopRoom("پردازش پیام بازی با خطا مواجه شد.");
            return;
          }
        }

        return;
      }

      if (message.type === "lobby/hello") {
        if (
          currentRole !== "host" ||
          verified ||
          phase !== "lobby" ||
          !isRecord(payload) ||
          payload.version !== PROTOCOL_VERSION
        ) {
          stopRoom("نسخه یا ترتیب پیام‌های لابی معتبر نیست.");
          return;
        }

        if (
          send({
            type: "lobby/welcome",
            payload: { version: PROTOCOL_VERSION },
          })
        ) {
          verifyPeer();
        }

        return;
      }

      if (message.type === "lobby/welcome") {
        if (
          currentRole !== "guest" ||
          verified ||
          phase !== "lobby" ||
          !isRecord(payload) ||
          payload.version !== PROTOCOL_VERSION
        ) {
          stopRoom("نسخهٔ برنامهٔ میزبان و مهمان یکسان نیست.");
          return;
        }

        verifyPeer();
        return;
      }

      if (message.type === "lobby/setReady") {
        if (
          currentRole !== "host" ||
          !verified ||
          !isRecord(payload) ||
          typeof payload.ready !== "boolean"
        ) {
          stopRoom("پیام آمادگی مهمان معتبر نیست.");
          return;
        }

        // درخواست آمادگی ممکن است هم‌زمان با شروع مسابقه
        // در مسیر شبکه باشد؛ پس از شروع دیگر اعمال نمی‌شود.
        if (phase !== "lobby") {
          return;
        }

        const nextReady = payload.ready;

        if (
          send({
            type: "lobby/state",
            payload: { guestReady: nextReady },
          })
        ) {
          ready = nextReady;
          setGuestReady(nextReady);
        }

        return;
      }

      if (message.type === "lobby/state") {
        if (
          currentRole !== "guest" ||
          !verified ||
          !isRecord(payload) ||
          typeof payload.guestReady !== "boolean"
        ) {
          stopRoom("وضعیت دریافتی لابی معتبر نیست.");
          return;
        }

        if (phase !== "lobby") {
          return;
        }

        readyPending = false;
        ready = payload.guestReady;
        setGuestReady(ready);
        return;
      }

      const isMatchMessage =
        message.type === "match/prepare" ||
        message.type === "match/loaded" ||
        message.type === "match/start";

      if (!isMatchMessage) {
        // پیام‌های دیگر در مراحل بعد اضافه می‌شوند.
        return;
      }

      if (!verified || !isMatchControlMessage(message)) {
        stopRoom("پیام شروع مسابقه معتبر نیست.");
        return;
      }

      if (message.type === "match/prepare") {
        if (currentRole !== "guest") {
          stopRoom("فقط میزبان می‌تواند مسابقه را آماده کند.");
          return;
        }

        if (
          phase !== "lobby" &&
          !(phase === "running" && ended && localRematch)
        ) {
          // تکرار همان درخواست بی‌اثر است.
          if (session?.matchId === message.payload.matchId) {
            return;
          }

          stopRoom("درخواست مسابقهٔ جدید در زمان نامعتبر دریافت شد.");
          return;
        }

        beginLoading({
          matchId: message.payload.matchId,
          role: "guest",
        });
        return;
      }

      // پیام‌های متعلق به جلسهٔ قبلی نباید روی جلسهٔ فعلی اثر کنند.
      if (!session || message.payload.matchId !== session.matchId) {
        return;
      }

      if (message.type === "match/loaded") {
        if (currentRole !== "host") {
          stopRoom("فرستندهٔ پیام بارگذاری معتبر نیست.");
          return;
        }

        if (phase !== "loading") {
          return;
        }

        guestLoaded = true;
        tryStartMatch();
        return;
      }

      if (message.type === "match/start") {
        if (currentRole !== "guest") {
          stopRoom("فقط میزبان می‌تواند فرمان شروع بدهد.");
          return;
        }

        if (phase === "running") {
          return;
        }

        if (phase !== "loading" || !localLoaded) {
          stopRoom("فرمان شروع پیش از آماده‌شدن بازی دریافت شد.");
          return;
        }

        clearLoadTimer();
        changePhase("running");
      }
    }

    const connection = new LanConnection({
      onStatus: (nextStatus) => {
        if (!active || nextStatus === currentStatus) {
          return;
        }

        const interruptedMatch = phase !== "lobby";
        currentStatus = nextStatus;
        setStatus(nextStatus);
        resetLobby();

        if (nextStatus !== "connected") {
          if (interruptedMatch) {
            setError("ارتباط قطع شد و مسابقه متوقف شد.");
          }
          return;
        }

        setError(null);

        handshakeTimer = setTimeout(() => {
          if (active && !verified) {
            stopRoom("تأیید لابی کامل نشد. نسخهٔ برنامهٔ دو گوشی را بررسی کن.");
          }
        }, HANDSHAKE_TIMEOUT_MS);

        if (currentRole === "guest") {
          send({
            type: "lobby/hello",
            payload: { version: PROTOCOL_VERSION },
          });
        }
      },

      onError: (message) => {
        if (active) {
          // خطای شبکه در زمان بارگذاری/بازی نباید جلسه را زنده بگذارد.
          if (phase !== "lobby") {
            stopRoom(message);
          } else {
            setError(message);
          }
        }
      },

      onMessage: handleMessage,
    });

    function openRoom(nextRole: MatchRole, hostIp?: string) {
      stopRoom(null);

      currentRole = nextRole;
      setRole(nextRole);

      if (nextRole === "host") {
        connection.host();
      } else {
        connection.join(hostIp ?? "");
      }
    }

    actionsRef.current = {
      startHosting: () => openRoom("host"),

      joinRoom: (hostIp) => openRoom("guest", hostIp),
      sendGameMessage: (message) => {
        if (
          !verified ||
          currentStatus !== "connected" ||
          phase !== "running" ||
          !session ||
          !isGameMessage(message) ||
          message.payload.matchId !== session.matchId
        ) {
          return false;
        }

        if (message.type === "game/rematch") {
          if (!ended || localRematch) return false;
          localRematch = true;
          if (!send(message)) return false;
          tryRematch();
          return true;
        }

        const validDirection =
          (currentRole === "guest" && message.type === "game/input") ||
          (currentRole === "host" && message.type === "game/snapshot");

        if (!validDirection) {
          return false;
        }

        if (
          message.type === "game/snapshot" &&
          message.payload.players.some((player) => player.health <= 0)
        ) {
          ended = true;
        }
        return send(message);
      },

      toggleReady: () => {
        if (
          currentRole !== "guest" ||
          !verified ||
          phase !== "lobby" ||
          readyPending
        ) {
          return;
        }

        setError(null);
        readyPending = true;

        send({
          type: "lobby/setReady",
          payload: { ready: !ready },
        });
      },

      startMatch: () => {
        if (
          currentRole !== "host" ||
          currentStatus !== "connected" ||
          !verified ||
          !ready ||
          phase !== "lobby"
        ) {
          return;
        }

        const matchId = createMatchId();

        // تغییر فوری phase جلوی چندبار شروع با لمس سریع را می‌گیرد.
        beginLoading({ matchId, role: "host" });

        send({
          type: "match/prepare",
          payload: {
            version: MATCH_PROTOCOL_VERSION,
            matchId,
          },
        });
      },

      markGameLoaded: (matchId) => {
        if (
          !verified ||
          phase !== "loading" ||
          !session ||
          session.matchId !== matchId ||
          localLoaded
        ) {
          return;
        }

        localLoaded = true;

        if (currentRole === "guest") {
          send({
            type: "match/loaded",
            payload: { matchId },
          });
        } else {
          tryStartMatch();
        }
      },

      leaveRoom: () => stopRoom(null),
    };

    return () => {
      active = false;
      actionsRef.current = null;
      clearHandshakeTimer();
      clearLoadTimer();
      connection.stop();
    };
  }, []);

  const startHosting = useCallback(() => {
    actionsRef.current?.startHosting();
  }, []);

  const joinRoom = useCallback((hostIp: string) => {
    actionsRef.current?.joinRoom(hostIp);
  }, []);

  const toggleReady = useCallback(() => {
    actionsRef.current?.toggleReady();
  }, []);

  const startMatch = useCallback(() => {
    actionsRef.current?.startMatch();
  }, []);

  const markGameLoaded = useCallback((matchId: string) => {
    actionsRef.current?.markGameLoaded(matchId);
  }, []);

  const leaveRoom = useCallback(() => {
    actionsRef.current?.leaveRoom();
  }, []);

  const canStartMatch =
    role === "host" &&
    status === "connected" &&
    peerVerified &&
    guestReady &&
    matchPhase === "lobby";
  const sendGameMessage = useCallback((message: GameMessage): boolean => {
    return actionsRef.current?.sendGameMessage(message) ?? false;
  }, []);

  const subscribeGameMessages = useCallback(
    (listener: (message: GameMessage) => void): (() => void) => {
      gameListenersRef.current.add(listener);

      return () => {
        gameListenersRef.current.delete(listener);
      };
    },
    [],
  );

  return {
    status,
    error,
    role,
    peerVerified,
    guestReady,
    matchPhase,
    matchSession,
    canStartMatch,
    startHosting,
    joinRoom,
    toggleReady,
    startMatch,
    markGameLoaded,
    leaveRoom,
    sendGameMessage,
    subscribeGameMessages,
  };
}
