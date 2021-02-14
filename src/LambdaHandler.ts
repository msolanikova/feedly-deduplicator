import { FeedlyService } from './FeedlyService';
import { FeedlyResponse } from './models/FeedlyResponse';
import { getFeedlyAuth } from './AwsService';
import { logger } from './LoggingUtils';

const REQUEST_LIMIT = process.env.FEEDLY_REQUEST_LIMIT ?? 15;
const log = logger(__filename);

export const lambdaHandler = async (): Promise<void> => {
  const feedlyAuth = await getFeedlyAuth();
  const feedlyService = new FeedlyService(feedlyAuth);

  const duplicatedArticleIds = await getDuplicatedArticleIds(feedlyService);
  await feedlyService.markArticlesAsRead(duplicatedArticleIds);
};

/**
 * Iterate over unread articles to identify duplicates by their URL
 * @param feedlyService
 */
const getDuplicatedArticleIds = async (feedlyService: FeedlyService): Promise<string[]> => {
  const duplicatedArticlesIds: string[] = [];
  const allArticlesUrls: Set<string> = new Set();

  let continuation;
  let allProcessed = false;
  let requestCount = 0;

  while (!allProcessed && requestCount < REQUEST_LIMIT) {
    log.debug(`Request number: ${requestCount}`);

    const unreadArticles: FeedlyResponse = await feedlyService.getUnreadArticles(continuation);
    requestCount++;

    for (const item of unreadArticles.items) {
      if (allArticlesUrls.has(item.originId)) {
        duplicatedArticlesIds.push(item.id);
      } else {
        allArticlesUrls.add(item.originId);
      }
    }

    continuation = unreadArticles.continuation;

    if (!continuation) {
      log.info(`Finished retrieving all unread articles with ${requestCount} requests`);
      allProcessed = true;
    }
  }

  if (requestCount >= REQUEST_LIMIT) {
    log.warn(`Couldn't retrieve all unread articles due to request limit (${REQUEST_LIMIT}). Executed ${requestCount} requests`);
  }

  log.info(`Found ${duplicatedArticlesIds.length} duplicated articles`);
  return duplicatedArticlesIds;
};
