import { FeedlyResponse } from '../models/FeedlyResponse';

export const FEEDLY_OK_SINGLE_ITEM_RESPONSE = {
  items: [
    {
      id: 'id1',
      originId: 'originId1',
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

export const ARTICLE_IDS = ['id1', 'id2', 'id3'];
export const NO_ARTICLE_IDS = [];
