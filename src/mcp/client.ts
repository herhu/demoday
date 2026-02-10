
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

  private async ensureConnected(): Promise<void> {
    if (this.connected) return;

    try {
      await this.client.connect(this.transport);
      // Optional (but nice): caches tool metadata and validates server tools exist
      try {
          await this.client.listTools();
      } catch (listError) {
          console.warn("Failed to list tools during connection warmup:", listError);
      }
      this.connected = true;
    } catch (e: any) {
      throw new ToolError(`Failed to connect MCP client: ${e?.message ?? String(e)}`, "N/A");
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

    await this.ensureConnected();

    let result: any;
    try {
      result = await this.client.callTool({ name: toolName, arguments: args as Record<string, unknown> });
    } catch (e: any) {
      throw new ToolError(`MCP callTool failed: ${e?.message ?? String(e)}`, correlationId);
    }

    if (result?.isError) {
      throw new ToolError(`Tool returned error: ${toolName}`, correlationId);
    }

    // Prefer structuredContent if you later add outputSchema
    if (result?.structuredContent) {
      // In SDK 1.0.1+, structuredContent might be the array. 
      // We assume the tool returns a shape that matches TResult or needs extraction.
      // For now, let's look for known patterns or return as is.
      // If the caller expects a specific type, we might need to handle it.
      // But typically structuredContent is { type: "resource" | "text" ... }[]
      // Let's fallback to text parsing if structuredContent isn't the direct Result.
    }

    const first = result?.content?.[0];
    const text = first && typeof first.text === "string" ? first.text : undefined;

    if (!text) {
      throw new ToolError(`Invalid tool output for ${toolName} (expected text)`, correlationId);
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
