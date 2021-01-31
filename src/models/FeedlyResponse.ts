export class FeedlyResponse {
  constructor(readonly continuation: string, readonly items: FeedlyItem[]) {}
}

export class FeedlyItem {
  constructor(readonly id: string, readonly originId: string) {}
}
