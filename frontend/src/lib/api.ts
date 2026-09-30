const API_BASE_URL ="http://127.0.0.1:8000";

export type OverviewStats = {
  videos: number;
  annotations: number;
  action_classes: number;
  object_classes: number;
  average_video_length: number;
  average_annotations_per_video: number;
};

export type ActionFrequency = {
  action_code: string;
  action_label: string;
  count: number;
};

export type SceneDistribution = {
  scene: string;
  count: number;
};

export type QualityOverview = {
  total_issues: number;
  errors: number;
  warnings: number;
  affected_videos: number;
};

export async function getOverviewStats(): Promise<OverviewStats> {
  const response = await fetch(
    `${API_BASE_URL}/api/stats/overview`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch overview statistics");
  }

  return response.json();
}


export async function getTopActions(
  limit = 5
): Promise<ActionFrequency[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/stats/actions?limit=${limit}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch action statistics");
  }

  const data = await response.json();

  return data.items;
}


export async function getSceneDistribution(): Promise<
  SceneDistribution[]
> {
  const response = await fetch(
    `${API_BASE_URL}/api/stats/scenes`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch scene statistics");
  }

  const data = await response.json();

  return data.items;
}


export async function getQualityOverview(): Promise<QualityOverview> {
  const response = await fetch(
    `${API_BASE_URL}/api/quality/overview`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch quality statistics");
  }

  return response.json();
}

export type VideoSummary = {
  id: string;
  subject: string;
  scene: string;
  quality: number | null;
  relevance: number | null;
  verified: string | null;
  length: number;
  annotation_count: number;
};

export type VideoListResponse = {
  items: VideoSummary[];
  total: number;
  limit: number;
  offset: number;
};

export async function getVideos(params?: {
  search?: string;
  scene?: string;
  limit?: number;
  offset?: number;
}): Promise<VideoListResponse> {
  const query = new URLSearchParams();

  if (params?.search) {
    query.set("search", params.search);
  }

  if (params?.scene) {
    query.set("scene", params.scene);
  }

  query.set("limit", String(params?.limit ?? 20));
  query.set("offset", String(params?.offset ?? 0));

  const response = await fetch(
    `${API_BASE_URL}/api/videos?${query.toString()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch videos");
  }

  return response.json();
}


export async function getScenes(): Promise<string[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/videos/scenes`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch scenes");
  }

  const data = await response.json();

  return data.items;
}

export type Annotation = {
  id: number;
  action_code: string;
  action_label: string;
  start_time: number;
  end_time: number;
  duration: number;
};

export type VideoDetail = {
  id: string;
  subject: string;
  scene: string;
  quality: number | null;
  relevance: number | null;
  verified: string | null;
  script: string | null;
  objects: string[];
  descriptions: string | null;
  length: number;
  annotations: Annotation[];
};


export async function getVideo(
  videoId: string
): Promise<VideoDetail> {
  const response = await fetch(
    `${API_BASE_URL}/api/videos/${encodeURIComponent(videoId)}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch video");
  }

  return response.json();
}

export type QualityIssue = {
  id: number;
  video_id: string;
  issue_type: string;
  severity: "error" | "warning";
  message: string;
  annotation_index: number | null;
};

export async function getQualityIssues(params?: {
  severity?: "error" | "warning";
  limit?: number;
  offset?: number;
}): Promise<{
  items: QualityIssue[];
  total: number;
  limit: number;
  offset: number;
}> {
  const query = new URLSearchParams();

  if (params?.severity) {
    query.set("severity", params.severity);
  }

  query.set("limit", String(params?.limit ?? 100));
  query.set("offset", String(params?.offset ?? 0));

  const response = await fetch(
    `${API_BASE_URL}/api/quality/issues?${query.toString()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch quality issues");
  }

  return response.json();
}

export type QualityBreakdownItem = {
  issue_type: string;
  severity: "error" | "warning";
  count: number;
};

export async function getQualityBreakdown(): Promise<{
  items: QualityBreakdownItem[];
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/quality/breakdown`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch quality breakdown");
  }

  return response.json();
}