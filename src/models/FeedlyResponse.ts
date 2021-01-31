export interface FeedlyResponse {
  readonly items: FeedlyItem[];
  readonly continuation?: string;
}

export interface FeedlyItem {
  readonly id: string;
  readonly originId: string;
}
