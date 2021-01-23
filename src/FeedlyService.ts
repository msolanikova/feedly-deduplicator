import { FeedlyAuth } from './FeedlyAuth';
import axios from 'axios';

export class FeedlyService {
  constructor(readonly feedlyAuth: FeedlyAuth) {
    axios.defaults.baseURL = 'https://cloud.feedly.com';
    axios.defaults.headers.common['Authorization'] = `OAuth ${this.feedlyAuth.token}`;
  }

  /**
   * Get all unread articles for given continuation (pagination)
   * @param continuation
   */
  getUnreadArticles = async (continuation: string): Promise<any> => {
    let unreadArticlesResponse;
    try {
      unreadArticlesResponse = await axios.get(`/v3/streams/contents`, {
        params: {
          streamId: `user/${this.feedlyAuth.user}/category/global.all`,
          unreadOnly: 'true',
          continuation: continuation,
        },
      });
    } catch (err) {
      console.error(`Couldn't retrieve unread articles. Response status: ${err.response.status}`);
      // todo: check if token expired (401) - send sns message
      // todo: check if rate limit exceeded (429) - send sns message
      throw new Error(err.message);
    }

    return unreadArticlesResponse.data;
  };

  /**
   * Mark all articles with given ids as read
   * @param articleIds
   */
  markArticlesAsRead = async (articleIds: string[]): Promise<void> => {
    if (articleIds.length == 0) {
      return;
    }

    const requestBody = {
      action: 'markAsRead',
      type: 'entries',
      entryIds: articleIds,
    };

    try {
      await axios.post(`/v3/markers`, requestBody);
      console.debug(`All ${articleIds.length} articles were marked as read`);
    } catch (err) {
      console.error(`Couldn't mark articles as read. Response status: ${err.response.status}`);
      throw new Error(err.message);
    }
  };
}
