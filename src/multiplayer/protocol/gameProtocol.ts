export type PlayerId = "host" | "guest";

export type PlayerInput = {
  // محور حرکت در بازهٔ منفی یک تا مثبت یک.
  moveX: number;
  moveZ: number;

  // جهت نگاه، بر حسب رادیان.
  yaw: number;
  pitch: number;

  // وضعیت فعلی دکمه‌ها، نه رویداد یک‌بار مصرف.
  jump: boolean;
  fire: boolean;
};

export type PlayerState = {
  id: PlayerId;

  position: {
    x: number;
    y: number;
    z: number;
  };

  yaw: number;
  pitch: number;
  health: number;
  shots: number;
  hits: number;
};

export type GameInputMessage = {
  type: "game/input";
  payload: {
    matchId: string;
    sequence: number;
    input: PlayerInput;
  };
};

export type GameSnapshotMessage = {
  type: "game/snapshot";
  payload: {
    matchId: string;
    sequence: number;

    // آخرین ورودی مهمان که میزبان پردازش کرده است.
    lastProcessedInput: number;

    players: [PlayerState, PlayerState];
  };
};

export type RematchMessage = {
  type: "game/rematch";
  payload: { matchId: string; sequence: number };
};

export type GameMessage =
  | GameInputMessage
  | GameSnapshotMessage
  | RematchMessage;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isSequence(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isAxis(value: unknown): value is number {
  return isFiniteNumber(value) && value >= -1 && value <= 1;
}

function isPitch(value: unknown): value is number {
  return isFiniteNumber(value) && value >= -Math.PI / 2 && value <= Math.PI / 2;
}

function isPlayerInput(value: unknown): value is PlayerInput {
  return (
    isRecord(value) &&
    isAxis(value.moveX) &&
    isAxis(value.moveZ) &&
    isFiniteNumber(value.yaw) &&
    isPitch(value.pitch) &&
    typeof value.jump === "boolean" &&
    typeof value.fire === "boolean"
  );
}

function isPlayerState(value: unknown): value is PlayerState {
  if (
    !isRecord(value) ||
    (value.id !== "host" && value.id !== "guest") ||
    !isRecord(value.position)
  ) {
    return false;
  }

  return (
    isFiniteNumber(value.position.x) &&
    isFiniteNumber(value.position.y) &&
    isFiniteNumber(value.position.z) &&
    isFiniteNumber(value.yaw) &&
    isPitch(value.pitch) &&
    isFiniteNumber(value.health) &&
    value.health >= 0 &&
    value.health <= 100 &&
    isSequence(value.shots) &&
    isSequence(value.hits) &&
    value.hits <= value.shots
  );
}

export function isGameMessage(value: unknown): value is GameMessage {
  if (!isRecord(value) || !isRecord(value.payload)) {
    return false;
  }

  const payload = value.payload;

  if (
    typeof payload.matchId !== "string" ||
    payload.matchId.length === 0 ||
    payload.matchId.length > 128 ||
    !isSequence(payload.sequence)
  ) {
    return false;
  }

  if (value.type === "game/rematch") return true;

  if (value.type === "game/input") {
    return isPlayerInput(payload.input);
  }

  if (value.type === "game/snapshot") {
    if (
      !isSequence(payload.lastProcessedInput) ||
      !Array.isArray(payload.players) ||
      payload.players.length !== 2
    ) {
      return false;
    }

    const [host, guest] = payload.players;

    return (
      isPlayerState(host) &&
      host.id === "host" &&
      isPlayerState(guest) &&
      guest.id === "guest"
    );
  }

  return false;
}
