import fs from "fs";
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

export function appendFeedback(ev: FeedbackEvent): void {
  const file = path.join(DATA_DIR, "feedback.json");
  const doc = JSON.parse(fs.readFileSync(file, "utf8")) as {
    _comment?: string;
    events: FeedbackEvent[];
  };
  doc.events.push(ev);
  fs.writeFileSync(file, JSON.stringify(doc, null, 2));
}
