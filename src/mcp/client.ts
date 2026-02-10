
import { auditLogger } from "../observability/audit.js";
import { ToolError } from "../utils/errors.js";

type McpToolTextResult = { content: Array<{ type: string; text?: string }> };

export class McpHttpClient {
  constructor(private readonly baseUrl: string) {}

  async callTool<TArgs extends object, TResult>(
    correlationId: string,
    toolName: string,
    args: TArgs
  ): Promise<TResult> {
    auditLogger.log({ correlationId, source: "mcpClient", event: "mcp.call", details: { toolName } });

    const payload = {
      jsonrpc: "2.0",
      id: correlationId,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    };

    const res = await fetch(`${this.baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": correlationId,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new ToolError(`MCP tool call failed (${res.status})`, correlationId);
    }

    const rpc = await res.json();

    if (rpc.error) {
      throw new ToolError(`MCP error: ${rpc.error.message ?? "unknown"}`, correlationId);
    }

    const result = rpc.result as McpToolTextResult;

    const first = result?.content?.[0];
    if (!first || first.type !== "text" || typeof first.text !== "string") {
      throw new ToolError("Invalid MCP tool output (expected text)", correlationId);
    }

    try {
      return JSON.parse(first.text) as TResult;
    } catch {
      throw new ToolError("MCP tool output was not valid JSON", correlationId);
    }
  }
}
