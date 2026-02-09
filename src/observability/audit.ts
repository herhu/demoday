


export interface AuditEntry {
  correlationId: string;
  timestamp: string;
  source: string;
  event: string;
  userId?: string;
  details?: any;
  error?: string;
}

export class AuditLogger {
  log(entry: Omit<AuditEntry, 'timestamp'>) {
    const fullEntry: AuditEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };
    // In a real app, this would go to a structured log aggregator
    console.log(JSON.stringify(fullEntry));
  }
}

export const auditLogger = new AuditLogger();
