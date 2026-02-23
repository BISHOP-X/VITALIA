# Copilot Instructions (Vitalia)

These instructions apply to all Copilot-assisted changes in this repository.

## Data-first (no guessing)

- Prefer **observed data** over assumptions.
  - Read the relevant files before editing.
  - When investigating runtime behavior, reproduce it (build/run) and use logs/output.
- If a claim depends on backend state, prefer querying the backend through **available tools** rather than inferring.

## MCP usage

- When backend or external-system state matters, use the available MCP tools (e.g., Supabase MCP) to validate:
  - database schema, policies, and migrations
  - edge function deployment state
  - configuration and secrets (never print secrets)
- If an MCP tool is disabled or unavailable, explicitly note the limitation and use the next-best verifiable source (repo code, local migrations, build output).

## MVP scope guardrails

- This is a student MVP with a demo-first approach.
- Do not expand scope beyond what is requested.
- Keep mock/demo data where it improves presentations; only wire “real” flows where already planned.

## Quality gates

- For any functional change, run the narrowest verification available (typecheck/build) and report results.
- Avoid unrelated refactors and formatting-only changes.

## Security

- Never log or commit credentials.
- Do not weaken RLS or introduce service-role keys into the client.
