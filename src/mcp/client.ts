import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { auditLogger } from "../observability/audit.js";
import { ToolError } from "../utils/errors.js";

export class McpHttpClient {
  private readonly client: Client;
  private readonly transport: StreamableHTTPClientTransport;
  private connected = false;

  constructor(private readonly baseUrl: string) {
    this.client = new Client(
      { name: "DemoOrchestrator", version: "1.0.0" },
      { capabilities: {} }
    );
    this.transport = new StreamableHTTPClientTransport(new URL("/mcp", this.baseUrl));
  }

  async warmup(correlationId: string): Promise<void> {
    await this.ensureConnected(correlationId);
  }

  private async ensureConnected(correlationId: string): Promise<void> {
    if (this.connected) return;

    try {
      await this.client.connect(this.transport);

      // Optional: cache tool metadata (non-fatal if it fails)
      try {
        await this.client.listTools();
      } catch (listError) {
        console.warn("Failed to list tools during connection warmup:", listError);
      }

      this.connected = true;
    } catch (e: any) {
      throw new ToolError(
        `Failed to connect MCP client: ${e?.message ?? String(e)}`,
        correlationId
      );
    }
  }

  async callTool<TArgs extends object, TResult>(
    correlationId: string,
    toolName: string,
    args: TArgs
  ): Promise<TResult> {
    auditLogger.log({
      correlationId,
      source: "mcpClient",
      event: "mcp.call",
      details: { toolName },
    });

    await this.ensureConnected(correlationId);

    let result: any;
    try {
      result = await this.client.callTool({
        name: toolName,
        arguments: args as Record<string, unknown>,
      });
    } catch (e: any) {
      throw new ToolError(`MCP callTool failed: ${e?.message ?? String(e)}`, correlationId);
    }

    if (result?.isError) {
      const errorText = result.content?.find((c: any) => c.type === 'text')?.text || 'Unknown error';
      throw new ToolError(`Tool returned error: ${toolName} - ${errorText}`, correlationId);
    }

    // ✅ Preferred path when outputSchema is defined on the server tool
    if (result?.structuredContent !== undefined) {
      return result.structuredContent as TResult;
    }

    // Fallback path for tools returning only text content
    const first = result?.content?.[0];
    const text = first && typeof first.text === "string" ? first.text : undefined;

    if (!text) {
      throw new ToolError(
        `Invalid tool output for ${toolName} (expected structuredContent or text)`,
        correlationId
      );
    }

    try {
      return JSON.parse(text) as TResult;
    } catch {
      throw new ToolError(`Tool output for ${toolName} was not valid JSON`, correlationId);
    }
  }

  async close(): Promise<void> {
    await this.transport.close();
    this.connected = false;
  }
}
