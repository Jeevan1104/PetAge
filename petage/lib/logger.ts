import "server-only";

type Level = "info" | "warn" | "error";

interface LogEntry {
  ts: string;
  level: Level;
  action: string;
  [key: string]: unknown;
}

function log(level: Level, action: string, data?: Record<string, unknown>): void {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    action,
    ...(data ?? {}),
  };

  if (process.env.NODE_ENV === "production") {
    process.stdout.write(JSON.stringify(entry) + "\n");
  } else {
    const { ts, level: lvl, action: act, ...rest } = entry;
    const extras = Object.keys(rest).length ? " " + JSON.stringify(rest) : "";
    const prefix = lvl === "error" ? "[ERROR]" : lvl === "warn" ? "[WARN] " : "[INFO] ";
    process.stdout.write(`${prefix} ${ts} ${act}${extras}\n`);
  }
}

export const logger = {
  info(action: string, data?: Record<string, unknown>): void {
    log("info", action, data);
  },
  warn(action: string, data?: Record<string, unknown>): void {
    log("warn", action, data);
  },
  error(action: string, data?: Record<string, unknown>): void {
    log("error", action, data);
  },
};
