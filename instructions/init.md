## Full development prompt (copy/paste)

Build a TypeScript project skeleton for an MCP reference implementation that integrates **Google Chat** (ingress/egress) and **Jira** (read-only) using **Fastify** and the **official Model Context Protocol TypeScript SDK**. The goal is a demo-ready slice showing MCP as a **control plane**: tool registry + schemas + policy + orchestration + logging. The demo must be deterministic, stable, and optimized for explaining architecture and complexity (not AI “wow” responses).

### 0) Project goals

- Provide a working service with two HTTP surfaces:
  1. `POST/GET /mcp` → MCP Streamable HTTP endpoint (served from Fastify)
  2. `POST /google-chat/webhook` → Google Chat webhook endpoint that triggers orchestration and posts a reply back to Chat

- Jira integration is **read-only** only:
  - search issues (JQL)
  - get issue by key

- MCP is not “a chat bot”; it is the **orchestration + governance layer** between LLM (optional) and tools.
- For demo reliability, intent parsing must be deterministic via **slash-like commands** (no LLM dependency required).

### 1) Tech stack constraints

- Node.js + TypeScript
- Fastify as HTTP server
- Use official MCP TypeScript SDK from modelcontextprotocol.io / typescript-sdk repository
- Prefer Zod (or JSON Schema) for validating:
  - inbound chat event normalization
  - tool args
  - tool outputs (optional but recommended)

- Use `fetch` (or undici) with timeouts and minimal retry for Jira calls
- Use dotenv for env management
- Include basic structured logging (Fastify logger is okay)

### 2) High-level architecture

- Keep these responsibilities separated:
  - `integrations/googleChat/*` handles ingress/egress only (HTTP webhook + post message)
  - `integrations/jira/*` handles Jira REST calls only (no orchestration decisions)
  - `mcp/*` owns MCP server creation + tool registration + transport endpoint wiring
  - `orchestration/*` owns policy, intent parsing, plan building, tool execution, formatting
  - `security/*` owns sanitization and secrets loading
  - `observability/*` owns audit logs and correlation IDs

- The LLM is optional and should never directly call tools. MCP/orchestrator decides tools.

### 3) Folder structure (must implement)

Use this structure and create empty or minimal working files as appropriate:

```
src/
  index.ts

  config/
    env.ts
    logger.ts

  mcp/
    server.ts
    tools/
      jiraSearch.ts
      jiraGetIssue.ts
    schemas/
      jiraSearch.schema.ts
      jiraGetIssue.schema.ts
    transport/
      mcpRoute.ts
      nodeBridge.ts

  orchestration/
    orchestrator.ts
    intent.ts
    policy.ts
    formatter.ts

  integrations/
    googleChat/
      webhookRoute.ts
      client.ts
      types.ts
    jira/
      client.ts
      types.ts

  security/
    secrets.ts
    sanitization.ts

  observability/
    audit.ts
    correlation.ts

  utils/
    http.ts
    errors.ts
    validate.ts
```

### 4) Environment variables

Create `.env.example` with required variables (names can be adjusted, but include these concepts):

- `PORT`
- `JIRA_BASE_URL`
- `JIRA_EMAIL` (or username)
- `JIRA_API_TOKEN`
- `JIRA_DEFAULT_PROJECT` (optional)
- `GOOGLE_CHAT_WEBHOOK_VERIFY_TOKEN` (if using verification)
- `GOOGLE_CHAT_API_TOKEN` or credentials needed to post back (or placeholder if demo uses incoming webhook response)
- `LOG_LEVEL`

In `config/env.ts`, implement safe env parsing and fail-fast errors for missing required vars.

### 5) MCP tool definitions (Jira read-only)

Implement two MCP tools using the official SDK patterns:

**Tool 1: `jira.searchIssues`**

- Input args:
  - `jql: string`
  - `maxResults?: number` default 10

- Output:
  - array of simplified issues: `{ key, summary, status, priority, assignee? }[]`

- Validate input with schema
- Validate output shape (light validation)

**Tool 2: `jira.getIssue`**

- Input args:
  - `issueKey: string`

- Output:
  - simplified issue: `{ key, summary, status, priority, description?, assignee? }`

Implementation must call `integrations/jira/client.ts`.

### 6) Google Chat integration

Implement `POST /google-chat/webhook` handler in `integrations/googleChat/webhookRoute.ts`:

- Parse incoming event (keep types in `types.ts`)
- Extract `userId`, `roomId`, and `text`
- Sanitize and normalize text:
  - trim, remove bot mention if present, enforce max length

- Pass to `orchestration/orchestrator.handleChatCommand(...)`
- Reply in one of two ways (pick the simplest for demo):
  1. respond directly with a Chat webhook response message body
     OR
  2. use `googleChat/client.ts` to post back asynchronously
     For demo simplicity, use **direct webhook response** if possible.

### 7) Deterministic intent commands (no LLM required)

Implement `orchestration/intent.ts` to parse a small set of commands:

Supported commands (exact):

- `/jira search <JQL...>`
  - Example: `/jira search project=ABC AND status="Open" ORDER BY priority DESC`

- `/jira open [projectKey]`
  - Example: `/jira open ABC` (uses predefined JQL template)

- `/jira mine [projectKey]`
  - Example: `/jira mine ABC` (assignee=current user context; if no mapping, omit)

- `/jira issue <KEY>`
  - Example: `/jira issue ABC-123`

Intent object must be strongly typed:

- `kind: "JIRA_SEARCH" | "JIRA_GET"`
- relevant fields (jql or issueKey, optional projectKey)

If input doesn’t match supported commands, return a help response listing available commands (do not call Jira).

### 8) Orchestration logic (must be policy-first)

Implement `orchestration/orchestrator.ts` with this sequence:

1. Audit log ingress (correlationId, userId, roomId, text)
2. Policy checks:
   - allowed source = googleChat
   - max text length
   - allowlist rooms/users optional (stub)

3. Parse intent (deterministic)
4. Build execution plan deterministically:
   - If JIRA_GET → invoke tool `jira.getIssue`
   - If JIRA_SEARCH → invoke `jira.searchIssues`

5. Validate tool args schema before invoking
6. Execute tool via internal tool implementation (not the LLM)
7. Handle errors safely:
   - timeouts
   - auth failure
   - Jira unavailable
     Return a safe message with correlationId and “try again” guidance

8. Format response deterministically:
   - bullet list for search results (max 10)
   - include issue key, summary, status, priority

9. Audit log egress

### 9) Policy module

Implement `orchestration/policy.ts` with:

- `assertWithinLimits(text)`
- `assertAllowedSource(source)`
- `assertAllowedTool(toolName)` (allowlist only Jira tools)
  Keep rules minimal but explicit.

### 10) Observability

Implement:

- `observability/correlation.ts` generating a correlationId per request
- `observability/audit.ts` to write structured logs for:
  - ingress
  - tool.call
  - tool.ok
  - tool.err
  - egress
    Use Fastify logger or console JSON logs.

### 11) MCP transport endpoint (`/mcp`)

Implement `mcp/transport/mcpRoute.ts` that exposes **one path** (e.g. `/mcp`) supporting GET and POST and hands off the raw Node request/response to the MCP SDK’s Streamable HTTP handler pattern. If exact SDK glue requires a specific adapter package, stub minimal scaffolding with clear TODO markers, but structure it correctly:

- Fastify route uses `req.raw` and `reply.raw`
- The MCP handler handles GET/POST per Streamable HTTP transport specification

### 12) Build and run requirements

- `npm run dev` starts Fastify on PORT
- Provide minimal `README.md`:
  - setup env
  - run server
  - example Google Chat payload curl
  - example commands
  - example Jira tool usage (via chat commands)

- Provide at least one basic test or a “manual test script” (optional for demo)

### 13) Demo success criteria

The resulting skeleton must allow me to demonstrate:

- contract-driven tool definitions
- deterministic orchestration
- separation of concerns (channel vs control plane vs tools)
- visible complexity: policy, schemas, error handling, logging

Deliverable: codebase skeleton with all modules, minimal working Jira read-only integration and Google Chat webhook flow, plus MCP endpoint scaffolding.

---

## What you do next (build order)

1. Scaffold folder structure + env validation + Fastify boot
2. Implement Jira client + tools
3. Implement deterministic intent + orchestrator
4. Implement Google Chat webhook endpoint and response formatting
5. Add audit logs + one failure path demo (e.g., wrong Jira token)
6. Add MCP endpoint scaffolding and tool registry wiring (SDK)
