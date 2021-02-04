import { FeedlyAuth } from './models/FeedlyAuth';
import axios, { AxiosResponse } from 'axios';
import { FeedlyResponse } from './models/FeedlyResponse';
import { sendGenericErrorMessage, sendLimitReachedMessage, sendTokenExpirationMessage } from './AwsService';

const PAGE_SIZE = 300;
export const feedlyClient = axios.create();

export class FeedlyService {
  constructor(readonly feedlyAuth: FeedlyAuth) {
    feedlyClient.defaults.baseURL = 'https://cloud.feedly.com';
    feedlyClient.defaults.headers.common['Authorization'] = `OAuth ${this.feedlyAuth.token}`;
    feedlyClient.defaults.timeout = 10_000;
  }

  /**
   * Get all unread articles for given continuation (pagination)
   * @param continuation
   */
  getUnreadArticles = async (continuation?: string): Promise<FeedlyResponse> => {
    let unreadArticlesResponse;
    try {
      unreadArticlesResponse = await feedlyClient.get(`/v3/streams/contents`, {
        params: {
          streamId: `user/${this.feedlyAuth.user}/category/global.all`,
          unreadOnly: 'true',
          continuation: continuation,
          count: PAGE_SIZE,
        },
      });
      this.logRateLimits(unreadArticlesResponse);
    } catch (err) {
      console.error(`Couldn't retrieve unread articles. Response status: ${err.response?.status}`);
      await this.handleErrorStatuses(err);

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
      const markersResponse = await feedlyClient.post(`/v3/markers`, requestBody);

      console.info(`All ${articleIds.length} articles were marked as read`);
      this.logRateLimits(markersResponse);
    } catch (err) {
      console.error(`Couldn't mark articles as read. Response status: ${err.response?.status}`);
      await this.handleErrorStatuses(err);

      throw new Error(err.message);
    }
  };

  private handleErrorStatuses = async (err: any): Promise<void> => {
    if (!err.response) {
      await sendGenericErrorMessage(err.message ?? 'Unknown error occurred');
      throw err;
    }

    this.logRateLimits(err?.response);

    switch (err?.response?.status ?? 0) {
      case 401:
        await sendTokenExpirationMessage(JSON.stringify(err.response?.data, null, 2) ?? 'unknown error');
        break;
      case 429:
        await sendLimitReachedMessage(JSON.stringify(err.response?.data, null, 2) ?? 'unknown error');
        break;
      default:
        await sendGenericErrorMessage(JSON.stringify(err.response?.data, null, 2) ?? 'unknown error');
        break;
    }
  };

  private logRateLimits = (response: AxiosResponse): void => {
    const limitMessage = `X-RateLimit-Limit: ${response?.headers['x-ratelimit-limit']}`;
    const countMessage = `X-RateLimit-Count: ${response?.headers['x-ratelimit-count']}`;
    const resetMessage = `X-RateLimit-Reset: ${response?.headers['x-ratelimit-reset']}`;

    console.debug(limitMessage);
    console.debug(countMessage);
    console.debug(resetMessage);
  };
}
