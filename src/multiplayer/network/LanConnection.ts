import TcpSocket from "react-native-tcp-socket";

type Socket = ReturnType<typeof TcpSocket.createConnection>;
type Server = ReturnType<typeof TcpSocket.createServer>;

export type LanMessage = {
  type: string;
  payload?: unknown;
};

export type LanStatus =
  | "idle"
  | "hosting"
  | "connecting"
  | "connected"
  | "disconnected";

export type LanCallbacks = {
  onStatus: (status: LanStatus) => void;
  onMessage: (message: LanMessage) => void;
  onError: (message: string) => void;
};

export const LAN_PORT = 40404;

const MAX_FRAME_LENGTH = 64 * 1024;
const CONNECT_TIMEOUT_MS = 10_000;

export class LanConnection {
  private server: Server | null = null;
  private socket: Socket | null = null;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;

  // رویدادهای اتصال قبلی نباید روی اتصال جدید اثر بگذارند.
  private generation = 0;

  constructor(private readonly callbacks: LanCallbacks) {}

  host(): void {
    this.stop();

    const generation = this.generation;

    try {
      const server = TcpSocket.createServer((socket) => {
        if (generation !== this.generation) {
          socket.destroy();
          return;
        }

        // این نسخه فقط یک مهمان دارد.
        if (this.socket) {
          socket.on("error", () => {});
          socket.destroy();
          return;
        }

        this.attachSocket(socket, generation);
        this.callbacks.onStatus("connected");
      });

      this.server = server;

      server.on("error", (error) => {
        if (generation !== this.generation) {
          return;
        }

        this.stop();
        this.callbacks.onError(String(error));
      });

      server.listen(
        {
          port: LAN_PORT,
          host: "0.0.0.0",
        },
        () => {
          if (generation === this.generation && !this.socket) {
            this.callbacks.onStatus("hosting");
          }
        },
      );
    } catch (error) {
      if (generation === this.generation) {
        this.stop();
        this.callbacks.onError(String(error));
      }
    }
  }

  join(hostIp: string): void {
    const host = hostIp.trim();

    // فعلاً اتصال فقط با IPv4 دستی است.
    const parts = host.split(".");
    const valid =
      parts.length === 4 &&
      parts.every(
        (part) =>
          /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255,
      );

    if (!valid || host === "0.0.0.0") {
      this.callbacks.onError("آدرس IPv4 میزبان معتبر نیست.");
      return;
    }

    this.stop();

    const generation = this.generation;
    this.callbacks.onStatus("connecting");

    try {
      const socket = TcpSocket.createConnection(
        {
          host,
          port: LAN_PORT,
          interface: "wifi",
        },
        () => {
          if (generation !== this.generation) {
            return;
          }

          this.clearConnectTimer();
          this.callbacks.onStatus("connected");
        },
      );

      this.attachSocket(socket, generation);

      this.connectTimer = setTimeout(() => {
        if (generation !== this.generation) {
          return;
        }

        this.stop();
        this.callbacks.onError(
          "مهلت اتصال تمام شد. IP، هات‌اسپات و بازبودن برنامهٔ میزبان را بررسی کن.",
        );
      }, CONNECT_TIMEOUT_MS);
    } catch (error) {
      if (generation === this.generation) {
        this.stop();
        this.callbacks.onError(String(error));
      }
    }
  }

  send(message: LanMessage): boolean {
    const socket = this.socket;

    if (!socket) {
      this.callbacks.onError("هنوز بازیکنی متصل نیست.");
      return false;
    }

    try {
      const json = JSON.stringify(message);

      // تبدیل کاراکترهای غیر ASCII به escape باعث می‌شود
      // شکستن بسته‌های TCP، متن فارسی را خراب نکند.
      const frame = json.replace(
        /[\u007f-\uffff]/g,
        (character) =>
          "\\u" + character.charCodeAt(0).toString(16).padStart(4, "0"),
      );

      if (frame.length > MAX_FRAME_LENGTH) {
        throw new Error("حجم پیام بیش از حد مجاز است.");
      }

      socket.write(frame + "\n");
      return true;
    } catch (error) {
      this.callbacks.onError(String(error));
      return false;
    }
  }

  stop(): void {
    this.generation++;
    this.clearConnectTimer();

    const socket = this.socket;
    const server = this.server;

    this.socket = null;
    this.server = null;

    // بستن یکی نباید مانع تلاش برای بستن دیگری شود.
    try {
      socket?.destroy();
    } catch {
      // ممکن است قبلاً بسته شده باشد.
    }

    try {
      server?.close();
    } catch {
      // ممکن است هنوز وارد وضعیت listening نشده باشد.
    }

    this.callbacks.onStatus("idle");
  }

  private attachSocket(socket: Socket, generation: number): void {
    this.socket = socket;

    let buffer = "";

    const isCurrent = () =>
      generation === this.generation && this.socket === socket;

    const rejectConnection = (reason: string) => {
      if (!isCurrent()) {
        return;
      }

      this.stop();
      this.callbacks.onError(reason);
    };

    socket.on("data", (data) => {
      if (!isCurrent()) {
        return;
      }

      buffer += typeof data === "string" ? data : data.toString("utf8");

      // TCP مرز پیام ندارد؛ ممکن است یک پیام در چند بسته
      // یا چند پیام در یک بسته دریافت شود.
      let newline = buffer.indexOf("\n");

      while (newline !== -1) {
        if (newline > MAX_FRAME_LENGTH) {
          rejectConnection("پیام دریافتی بیش از حد بزرگ است.");
          return;
        }

        const frame = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);

        let message: LanMessage;

        try {
          const parsed: unknown = JSON.parse(frame);

          if (
            typeof parsed !== "object" ||
            parsed === null ||
            !("type" in parsed) ||
            typeof parsed.type !== "string"
          ) {
            throw new Error("Invalid message");
          }

          message = parsed as LanMessage;
        } catch {
          rejectConnection("قالب پیام دریافتی معتبر نیست.");
          return;
        }

        this.callbacks.onMessage(message);

        if (!isCurrent()) {
          return;
        }

        newline = buffer.indexOf("\n");
      }

      if (buffer.length > MAX_FRAME_LENGTH) {
        rejectConnection("پیام ناقص بیش از حد بزرگ است.");
      }
    });

    socket.on("error", (error) => {
      rejectConnection(String(error));
    });

    socket.on("close", () => {
      if (!isCurrent()) {
        return;
      }

      this.clearConnectTimer();
      this.socket = null;

      this.callbacks.onStatus(this.server ? "hosting" : "disconnected");
    });
  }

  private clearConnectTimer(): void {
    if (this.connectTimer !== null) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
  }
}
