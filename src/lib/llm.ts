// ── LLM as FORMATTER ONLY — never a fact source. It composes the draft opener
// from already-verified facts (it does not pick accounts, compute GM, or rank).
// Provider precedence: OPENROUTER_API_KEY → OpenRouter (OpenAI-compatible),
// else ANTHROPIC_API_KEY → Anthropic direct, else a deterministic template so
// the demo runs with zero credentials. Either way the AM edits and sends —
// the opener is never auto-sent.

export interface OpenerFacts {
  am: string;
  client: string;
  our_metro: string;
  our_role: string;
  our_headcount: number;
  our_fill_pct: number;
  their_metro: string;
  their_open_reqs: number;
  their_role: string;
  catalyst: string; // e.g. "announced a new Phoenix DC"
}

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_OPENROUTER_MODEL = "anthropic/claude-3.5-haiku";

export async function draftOpener(f: OpenerFacts): Promise<{ text: string; source: "llm" | "template" }> {
  const orKey = process.env.OPENROUTER_API_KEY;
  const anthKey = process.env.ANTHROPIC_API_KEY;
  try {
    if (orKey) {
      const t = await callOpenRouter(orKey, f);
      if (t) return { text: t.trim(), source: "llm" };
    } else if (anthKey) {
      const t = await callAnthropic(anthKey, f);
      if (t) return { text: t.trim(), source: "llm" };
    }
  } catch {
    // fall through to template
  }
  return { text: template(f), source: "template" };
}

function buildPrompt(f: OpenerFacts): string {
  return (
    `You are drafting a short, warm outreach opener that a staffing account manager will EDIT before sending to an existing client. ` +
    `Use ONLY these verified facts; do not invent names, numbers, or claims:\n` +
    `- Account manager: ${f.am}\n- Client: ${f.client}\n- We already staff: ${f.our_headcount} ${f.our_role} in ${f.our_metro} at ${f.our_fill_pct}% fill\n` +
    `- Catalyst: client ${f.catalyst}\n- Opportunity: ${f.their_open_reqs} open ${f.their_role} roles in ${f.their_metro}, where we don't serve them yet\n` +
    `Write 3-4 sentences, first person from the AM, no subject line, leave a [name] placeholder for the contact. Plain text only.`
  );
}

function template(f: OpenerFacts): string {
  return (
    `Hi [name], it's ${f.am} from Westbrook. We've run your ${f.our_metro} ${f.our_role.toLowerCase()} team for a while now ` +
    `(~${f.our_headcount} on assignment, ${f.our_fill_pct}% fill). I noticed ${f.client} ${f.catalyst} and is posting ${f.their_open_reqs} ` +
    `${f.their_role.toLowerCase()} roles in ${f.their_metro}, where we don't support you yet. We can stand up a ${f.their_metro} crew with the ` +
    `same playbook we run in ${f.our_metro}. Worth a 15-minute call to see if it's useful?`
  );
}

async function callOpenRouter(key: string, f: OpenerFacts): Promise<string | null> {
  const model = process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://westbrook-radar.local",
      "X-Title": "Westbrook Expansion Radar",
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      messages: [{ role: "user", content: buildPrompt(f) }],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? null;
}

async function callAnthropic(key: string, f: OpenerFacts): Promise<string | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: buildPrompt(f) }],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return data.content?.find((c) => c.type === "text")?.text ?? null;
}
