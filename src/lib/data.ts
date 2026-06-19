import fs from "fs";
import os from "os";
import path from "path";
import type {
  Account,
  ExternalSignal,
  RelationshipFlag,
  AlsoSurfacedRow,
  FeedbackEvent,
} from "./types";

// The /data folder is "the whole world" for this thin slice — flat JSON a peer
// can read in one screen. Read at runtime (not import-bundled) so the demo can
// also write feedback back to disk.
export const DATA_DIR = path.join(process.cwd(), "data");

function read<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), "utf8")) as T;
}

export function loadAccounts(): Account[] {
  return read<{ accounts: Account[] }>("internal_accounts.json").accounts;
}

export function loadSignals(): ExternalSignal[] {
  return read<{ signals: ExternalSignal[] }>("external_signals.json").signals;
}

export function loadFlags(): RelationshipFlag[] {
  return read<{ flags: RelationshipFlag[] }>("relationship_flags.json").flags;
}

export function loadAlsoSurfaced(): AlsoSurfacedRow[] {
  return read<{ rows: AlsoSurfacedRow[] }>("also_surfaced.json").rows;
}

export function loadFeedback(): FeedbackEvent[] {
  return read<{ events: FeedbackEvent[] }>("feedback.json").events;
}

// On a local run we persist to data/feedback.json; on a read-only serverless
// host (Vercel) the data dir isn't writable, so we fall back to /tmp (ephemeral
// per instance — fine for a hosted demo). Never throws.
const TMP_FEEDBACK = path.join(os.tmpdir(), "westbrook-feedback.json");

export function appendFeedback(ev: FeedbackEvent): void {
  const primary = path.join(DATA_DIR, "feedback.json");
  const src = fs.existsSync(TMP_FEEDBACK) ? TMP_FEEDBACK : primary;
  const doc = JSON.parse(fs.readFileSync(src, "utf8")) as {
    _comment?: string;
    events: FeedbackEvent[];
  };
  doc.events.push(ev);
  const out = JSON.stringify(doc, null, 2);
  try {
    fs.writeFileSync(primary, out);
  } catch {
    fs.writeFileSync(TMP_FEEDBACK, out);
  }
}
