import { ScheduledEvent } from 'aws-lambda';
import SecretsManager from 'aws-sdk/clients/secretsmanager';
import axios from 'axios';
import { FeedlyAuth } from './FeedlyAuth';

const REQUEST_LIMIT = 15;

export const lambdaHandler = async (event: ScheduledEvent): Promise<void> => {
  const feedlyAuth = await getFeedlyToken();

  axios.defaults.baseURL = 'https://cloud.feedly.com';

  const duplicatedArticleIds = await getDuplicatedArticleIds(feedlyAuth);

  await markDuplicatedArticlesAsRead(feedlyAuth, duplicatedArticleIds);
};

const getDuplicatedArticleIds = async (feedlyAuth: FeedlyAuth): Promise<string[]> => {
  const duplicatedArticlesIds: string[] = [];

  const allArticlesUrls: Set<string> = new Set();

  let unreadArticlesResponse;
  let continuation = '';
  let allProcessed = false;

  let requestCount = 0;

  while (!allProcessed || requestCount < REQUEST_LIMIT) {
    console.debug(`Request number: ${requestCount}`);
    try {
      unreadArticlesResponse = await axios.get(`/v3/streams/contents`, {
        params: {
          streamId: `user/${feedlyAuth.user}/category/global.all`,
          unreadOnly: 'true',
          continuation: continuation,
        },
        headers: {
          Authorization: `OAuth ${feedlyAuth.token}`,
        },
      });
      requestCount++;
    } catch (err) {
      console.error(`Couldn't retrieve unread articles. Response status: ${err.response.status}`);
      // todo: check if token expired (401) - send sns message
      // todo: check if rate limit exceeded (429) - send sns message
      throw err;
    }

    for (const item of unreadArticlesResponse.data.items) {
      if (allArticlesUrls.has(item.canonicalUrl)) {
        duplicatedArticlesIds.push(item.id);
      } else {
        allArticlesUrls.add(item.canonicalUrl);
      }
    }

    continuation = unreadArticlesResponse.data.continuation;

    if (!continuation) {
      console.debug(`Finished retrieving all unread articles with ${requestCount} requests`);
      allProcessed = true;
    }
  }

  console.debug(`Found ${duplicatedArticlesIds.length} duplicated articles`);
  return duplicatedArticlesIds;
};

const markDuplicatedArticlesAsRead = async (feedlyAuth: FeedlyAuth, duplicatedArticleIds: string[]) => {
  if (duplicatedArticleIds.length == 0) {
    return;
  }

  const requestBody = {
    action: 'markAsRead',
    type: 'entries',
    entryIds: duplicatedArticleIds,
  };

  try {
    await axios.post(`/v3/markers`, requestBody, {
      headers: {
        Authorization: `OAuth ${feedlyAuth.token}`,
      },
    });
    console.debug(`All ${duplicatedArticleIds.length} duplicated articles were marked as read`);
  } catch (err) {
    console.error(`Couldn't mark articles as unread. Response status: ${err.response.status}`);
    throw err;
  }
};

const getFeedlyToken = async (): Promise<FeedlyAuth> => {
  const params = {
    SecretId: 'FeedlyAuth',
  };
  const secretsManager = new SecretsManager();
  const secretResponse = await secretsManager.getSecretValue(params).promise();
  const feedlyAuthJson = JSON.parse(secretResponse.SecretString ?? '{}');

  return new FeedlyAuth(feedlyAuthJson['token'], feedlyAuthJson['user']);
};
