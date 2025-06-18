export interface WidgetProps {
  id: string;
  title?: string;
  streamId?: string;
  config?: Record<string, unknown>;
}

export interface StreamData {
  timestamp: number;
  value: unknown;
  metadata?: Record<string, unknown>;
}

export interface ChartData extends StreamData {
  value: number | { x: number; y: number };
  series?: string;
}

export interface TableData extends StreamData {
  value: Record<string, unknown>;
}

export interface LogData extends StreamData {
  value: {
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    details?: unknown;
  };
}
