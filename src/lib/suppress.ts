import type { Account, RelationshipFlag } from "./types";

// ── Two distinct guardrails, on purpose:
// 1) AM-OWNED hard suppression (relationship_flags.json): the AM pre-loaded this;
//    we honor it silently-hard. The system NEVER infers at-risk/MSP from data.
// 2) SYSTEM-SURFACED candidate conflict (free-text notes): we proactively catch a
//    landmine the AM may not have flagged, but we HOLD it for AM confirmation
//    rather than deciding alone. Catching a dangerous play earns more trust than
//    surfacing ten safe ones.

const HARD_FLAGS = ["at_risk", "msp_locked", "vms_locked", "do_not_contact"];

// role-family -> keywords that, if found near "internally"/"do not pitch" in
// notes, imply the client handles that function themselves.
const ROLE_KEYWORDS: Record<string, string[]> = {
  it: ["it", "engineering", "help desk", "helpdesk", "technology", "software"],
  nursing: ["nursing", "rn", "clinical"],
  allied_health: ["allied", "clinical"],
  clerical: ["clerical", "admin", "back office"],
};

export type SuppressResult =
  | { held: false }
  | { held: true; reason: string; kind: "am_owned_hard" | "note_surfaced"; needs_confirm: boolean };

export function suppress(account: Account, roleCanonical: string, flags: RelationshipFlag[]): SuppressResult {
  // (1) AM-owned hard flag
  const flag = flags.find((f) => f.account_id === account.account_id && HARD_FLAGS.includes(f.flag));
  if (flag) {
    return {
      held: true,
      kind: "am_owned_hard",
      needs_confirm: false,
      reason: `AM-flagged "${flag.flag}" by ${flag.owner}: ${flag.note}`,
    };
  }

  // (2) Note-surfaced candidate conflict
  const notes = account.notes.toLowerCase();
  const signalsInternal = notes.includes("internally") || notes.includes("do not pitch") || notes.includes("handled internally");
  if (signalsInternal) {
    const kws = ROLE_KEYWORDS[roleCanonical] ?? [roleCanonical];
    if (kws.some((k) => notes.includes(k))) {
      return {
        held: true,
        kind: "note_surfaced",
        needs_confirm: true,
        reason: `Possible conflict from account notes — client may handle this function internally. Notes: "${account.notes}" — confirm with AM before pursuing.`,
      };
    }
  }

  return { held: false };
}
