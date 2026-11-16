export const MATCH_PROTOCOL_VERSION = 1;

export type MatchRole = "host" | "guest";

export type MatchPhase = "lobby" | "loading" | "running";

export type MatchSession = {
  matchId: string;
  role: MatchRole;
};

export type MatchPrepareMessage = {
  type: "match/prepare";
  payload: {
    version: typeof MATCH_PROTOCOL_VERSION;
    matchId: string;
  };
};

export type MatchLoadedMessage = {
  type: "match/loaded";
  payload: {
    matchId: string;
  };
};

export type MatchStartMessage = {
  type: "match/start";
  payload: {
    matchId: string;
  };
};

export type MatchControlMessage =
  | MatchPrepareMessage
  | MatchLoadedMessage
  | MatchStartMessage;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidMatchId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 128;
}

/**
 * اعتبارسنجی ساختار پیام دریافتی از شبکه.
 *
 * بررسی نقش فرستنده و ترتیب پیام‌ها در useLanRoom انجام می‌شود.
 */
export function isMatchControlMessage(
  value: unknown,
): value is MatchControlMessage {
  if (!isRecord(value) || !isRecord(value.payload)) {
    return false;
  }

  const payload = value.payload;

  if (!isValidMatchId(payload.matchId)) {
    return false;
  }

  switch (value.type) {
    case "match/prepare":
      return payload.version === MATCH_PROTOCOL_VERSION;

    case "match/loaded":
    case "match/start":
      return true;

    default:
      return false;
  }
}

/**
 * شناسهٔ تطبیق پیام‌های یک مسابقه؛ توکن امنیتی نیست.
 * فقط میزبان آن را ایجاد می‌کند.
 */
export function createMatchId(): string {
  return [
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}
