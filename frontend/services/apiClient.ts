import axios from 'axios';

// Configuration - use environment variables or fallback to localhost
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      console.error('API Error Status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API interfaces
export interface FactCheckRequest {
  text: string;
  pipeline?: 'fact' | 'educational';
}

export interface FactCheckResponse {
  status: string;
  pipeline: string;
  process_id: number;
}

export interface FactCheckResult {
  response: string;
  sources: string[];
}

export interface StatusResponse {
  status: 'idle' | 'running' | 'completed';
  pid?: number;
  return_code?: number;
}

export interface LogEntry {
  timestamp: string;
  logger: string;
  level: string;
  message: string;
  type: string;
}

export interface LogsResponse {
  logs: LogEntry[];
}

export interface ResultsResponse {
  results: any[];
  final_result: string | null;
}

export interface EducationalContent {
  id: string;
  title: string;
  description: string;
  content?: string;
  category?: string;
  difficulty?: string;
  tags?: string[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

// API methods
const api = {
  // Fact checking endpoints
  async startFactCheck(text: string, pipeline: 'fact' | 'educational' = 'fact'): Promise<FactCheckResponse> {
    const response = await apiClient.post<FactCheckResponse>('/api/fact-check', {
      text,
      pipeline,
    });
    return response.data;
  },

  async getStatus(): Promise<StatusResponse> {
    const response = await apiClient.get<StatusResponse>('/api/status');
    return response.data;
  },

  async getLogs(): Promise<LogsResponse> {
    const response = await apiClient.get<LogsResponse>('/api/logs');
    return response.data;
  },

  async getResults(): Promise<ResultsResponse> {
    const response = await apiClient.get<ResultsResponse>('/api/results');
    return response.data;
  },

  async getFactCheckResult(): Promise<FactCheckResult> {
    const response = await apiClient.get<FactCheckResult>('/api/fact-check-result');
    return response.data;
  },

  // Educational content endpoints
  async searchEducationalContent(query: string): Promise<EducationalContent[]> {
    // This endpoint would need to be implemented on the backend
    // For now, return mock data
    return Promise.resolve([
      {
        id: 'search-1',
        title: `Understanding ${query}`,
        description: `Comprehensive guide about ${query} and its implications in media literacy.`,
        content: `This is detailed information about ${query}...`,
        category: 'Search Result',
        difficulty: 'intermediate',
        tags: ['media-literacy', query.toLowerCase()],
      },
      {
        id: 'search-2',
        title: `How to Identify ${query}`,
        description: `Practical tips for recognizing and dealing with ${query} in digital media.`,
        content: `Learn practical strategies for ${query}...`,
        category: 'Search Result',
        difficulty: 'beginner',
        tags: ['fact-checking', query.toLowerCase()],
      },
    ]);
  },

  async getEducationalContent(id: string): Promise<EducationalContent | null> {
    // This endpoint would need to be implemented on the backend
    // For now, return mock data
    return Promise.resolve({
      id,
      title: 'Educational Content',
      description: 'Sample educational content',
      content: 'This is sample content...',
      category: 'General',
      difficulty: 'intermediate',
      tags: ['education'],
    });
  },

  // Health check
  async checkHealth(): Promise<HealthResponse> {
    const response = await apiClient.get<HealthResponse>('/api/health');
    return response.data;
  },

  // Download extension
  async downloadExtension(): Promise<Blob> {
    const response = await apiClient.get('/api/download-extension', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;