import { FeedlyResponse } from '../models/FeedlyResponse';

/**
 * FEEDLY
 */
export const FEEDLY_RESPONSE_OK_SINGLE_ITEM = {
  items: [
    {
      id: 'id1',
      originId: 'originId1',
    },
  ],
} as FeedlyResponse;

export const FEEDLY_RESPONSE_OK_MULTIPLE_ITEMS_2_DUPLICATES = {
  items: [
    {
      id: 'id1',
      originId: 'originId1',
    },
    {
      id: 'id2',
      originId: 'originId2',
    },
    {
      id: 'id3',
      originId: 'originId3',
    },
    {
      id: 'duplicatedId1',
      originId: 'originId1',
    },
    {
      id: 'duplicatedId2',
      originId: 'originId2',
    },
  ],
} as FeedlyResponse;

export const FEEDLY_RESPONSE_OK_MULTIPLE_ITEMS_2_DUPLICATES_WITH_CONTINUATION_PAGE1 = {
  continuation: 'page2',
  items: [
    {
      id: 'id1',
      originId: 'originId1',
    },
    {
      id: 'id2',
      originId: 'originId2',
    },
    {
      id: 'id3',
      originId: 'originId3',
    },
    {
      id: 'duplicatedId1',
      originId: 'originId1',
    },
    {
      id: 'duplicatedId2',
      originId: 'originId2',
    },
  ],
} as FeedlyResponse;

export const FEEDLY_RESPONSE_OK_MULTIPLE_ITEMS_2_DUPLICATES_WITHOUT_CONTINUATION_PAGE2 = {
  items: [
    {
      id: 'duplicatedId3',
      originId: 'originId3',
    },
    {
      id: 'id7',
      originId: 'originId7',
    },
  ],
} as FeedlyResponse;

export const FEEDLY_RATE_LIMIT_OK_HEADERS = {
  'x-ratelimit-limit': 250,
  'x-ratelimit-count': 1,
  'x-ratelimit-reset': 123,
};

export const FEEDLY_RATE_LIMIT_REACHED_HEADERS = {
  'x-ratelimit-limit': 250,
  'x-ratelimit-count': 251,
  'x-ratelimit-reset': 123,
};

export const ERROR_RESPONSE = (status: number) => ({
  response: {
    status: status,
  },
});

/**
 * ARTICLES
 */
export const ARTICLE_IDS = ['id1', 'id2', 'id3'];
export const NO_ARTICLE_IDS = [];

/**
 * SECRETS
 */
export const USER = 'user123';
export const TOKEN = 'token123';
export const SECRET_MANAGER_RESPONSE = {
  SecretString: JSON.stringify({ user: USER, token: TOKEN }),
};
