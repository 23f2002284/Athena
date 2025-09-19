export interface FactCheckResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    [key: string]: any;
  };
  error?: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'warning' | 'error';
}

export interface CheckResult {
  [key: string]: any;
}

declare const api: {
  startFactCheck: (text: string, pipeline?: string) => Promise<FactCheckResponse>;
  getStatus: () => Promise<{ status: string }>;
  getLogs: () => Promise<LogEntry[]>;
  getResults: () => Promise<CheckResult>;
};

export default api;
