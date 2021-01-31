export class FeedlyAuth {
  constructor(readonly token: string, readonly user: string) {
    if (!token) {
      throw new Error(`Feedly token is not defined`);
    }
    if (!user) {
      throw new Error(`Feedly user is not defined`);
    }
  }
}
