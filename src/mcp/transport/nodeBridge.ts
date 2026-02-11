
import { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Creates a bridge between Node.js HTTP (Fastify raw) and the MCP SDK transport.
 * 
 * Supports multiple sessions by creating a new StreamableHTTPServerTransport for 
 * each initialization request.
 */
export async function createMcpHttpBridge(serverFactory: () => McpServer) {
  const sessions = new Map<string, { server: McpServer, transport: StreamableHTTPServerTransport }>();

  return {
    async handle(req: IncomingMessage, res: ServerResponse) {
        let session: { server: McpServer, transport: StreamableHTTPServerTransport } | undefined;
        let isNew = false;
        
        const sessionId = req.headers['mcp-session-id'] as string;

        if (sessionId) {
            session = sessions.get(sessionId);
            if (!session) {
                res.statusCode = 404;
                res.setHeader("content-type", "application/json");
                res.end(JSON.stringify({ 
                    jsonrpc: "2.0", 
                    error: { code: -32001, message: "Session not found" }, 
                    id: null 
                }));
                return;
            }
        } else {
            // No session ID -> treat as new session (Initialize)
            isNew = true;
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
            });
            const server = serverFactory();

            // Connect the new transport to the new MCP server instance
            try {
                await server.connect(transport);
            } catch (err) {
                console.error('Failed to connect new transport:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Internal Server Error" }));
                return;
            }

            session = { server, transport };

            // Hook up cleanup
            transport.onclose = () => {
                if (transport.sessionId) {
                    sessions.delete(transport.sessionId);
                    console.log(`Session ${transport.sessionId} closed`);
                }
                server.close().catch(err => console.error("Error closing server:", err));
            };
        }

        try {
            // Delegate request to the transport
            await session.transport.handleRequest(req, res);

            // If it was a new session and successfully engaged, store it
            if (isNew && session.transport.sessionId) {
                sessions.set(session.transport.sessionId, session);
                console.log(`New session established: ${session.transport.sessionId}`);
            }
        } catch (err) {
            console.error('MCP Transport error:', err);
            if (!res.headersSent) {
                res.statusCode = 500;
                res.setHeader("content-type", "application/json");
                res.end(JSON.stringify({ error: "MCP transport internal error" }));
            } else {
                res.end();
            }
        }
    },
  };
}


