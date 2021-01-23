import { ScheduledEvent } from 'aws-lambda';
import SecretsManager from 'aws-sdk/clients/secretsmanager';
import axios from 'axios';
import { FeedlyAuth } from './FeedlyAuth';

export const lambdaHandler = async (event: ScheduledEvent): Promise<void> => {
  const feedlyAuth = await getFeedlyToken();

  axios.defaults.baseURL = 'https://cloud.feedly.com';

  const duplicatedArticleIds = await getDuplicatedArticleIds(feedlyAuth);

  markDuplicatedArticlesAsRead(feedlyAuth, duplicatedArticleIds);
};

const getDuplicatedArticleIds = async (feedlyAuth: FeedlyAuth): Promise<string[]> => {
  const duplicatedArticlesIds: string[] = [];

  const allArticlesUrls: Set<string> = new Set();

  let unreadArticlesResponse;
  let continuation = '';
  let allProcessed = false;

  while (!allProcessed) {
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

    if (unreadArticlesResponse.status != 200) {
      throw new Error(`Couldn't retrieve unread articles. Response: ${JSON.stringify(unreadArticlesResponse)}`);
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
      console.debug(`Finished retrieving all unread articles`);
      allProcessed = true;
    }
  }

  return duplicatedArticlesIds;
};

const markDuplicatedArticlesAsRead = async (feedlyAuth: FeedlyAuth, duplicatedArticleIds: string[]) => {
  const requestBody = {
    action: 'markAsRead',
    type: 'entries',
    entryIds: duplicatedArticleIds,
  };

  const markerResponse = await axios.post(`/v3/markers`, requestBody, {
    headers: {
      Authorization: `OAuth ${feedlyAuth.token}`,
    },
  });

  if (markerResponse.status != 200) {
    throw new Error(`Couldn't mark articles as unread. Response: ${JSON.stringify(markerResponse)}`);
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
