export type AnalysisRequest = {
  text: string;
  context?: Record<string, unknown> | null;
};

export type AnalysisResponse = {
  is_misinformation: boolean;
  confidence: number;
  explanation: string;
  sources: Array<{ title: string; url: string }>;
};

export type EducationalContent = {
  id: string;
  title: string;
  content: string;
  category: string;
  difficulty: string;
  tags: string[];
};



const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  baseUrl: DEFAULT_BASE_URL,

  // Analysis methods
  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    const res = await fetch(`${DEFAULT_BASE_URL}/api/misinformation/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<AnalysisResponse>(res);
  },

  // Content methods
  async listContent(params?: {
    category?: string;
    difficulty?: string;
    tags?: string;
  }): Promise<EducationalContent[]> {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.difficulty) qs.set('difficulty', params.difficulty);
    if (params?.tags) qs.set('tags', params.tags);
    const query = qs.toString();
    const url = `${DEFAULT_BASE_URL}/api/education/content${query ? `?${query}` : ''}`;
    const res = await fetch(url);
    return handleResponse<EducationalContent[]>(res);
  },

  async getContentById(id: string): Promise<EducationalContent> {
    const res = await fetch(`${DEFAULT_BASE_URL}/api/education/content/${encodeURIComponent(id)}`);
    return handleResponse<EducationalContent>(res);
  },
};


