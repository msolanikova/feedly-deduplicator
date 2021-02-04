import MockAdapter from 'axios-mock-adapter';
import { FeedlyAuth } from '../models/FeedlyAuth';
import { feedlyClient, FeedlyService } from '../FeedlyService';
import * as AwsService from '../AwsService';
import {
  ARTICLE_IDS,
  ERROR_RESPONSE,
  FEEDLY_OK_SINGLE_ITEM_RESPONSE,
  FEEDLY_RATE_LIMIT_OK_HEADERS,
  FEEDLY_RATE_LIMIT_REACHED_HEADERS,
  NO_ARTICLE_IDS,
} from './TestData';

jest.mock('../AwsService');
const awsServiceMock = AwsService as jest.Mocked<typeof AwsService>;
const axiosMock = new MockAdapter(feedlyClient);
const service = new FeedlyService(new FeedlyAuth('token', 'user'));

describe('FeedlyService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    axiosMock.reset();
  });

  describe('getUnreadArticles', () => {
    it('should return same response as feedly', async () => {
      axiosMock.onGet('/v3/streams/contents').reply(200, FEEDLY_OK_SINGLE_ITEM_RESPONSE, FEEDLY_RATE_LIMIT_OK_HEADERS);

      const response = await service.getUnreadArticles();
      expect(response).toEqual(FEEDLY_OK_SINGLE_ITEM_RESPONSE);

      expect(awsServiceMock.sendTokenExpirationMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendLimitReachedMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendGenericErrorMessage).toBeCalledTimes(0);
    });

    it('should send token expiration message if token expired', async () => {
      axiosMock.onGet('/v3/streams/contents').reply(401, ERROR_RESPONSE(401), FEEDLY_RATE_LIMIT_OK_HEADERS);

      await expect(service.getUnreadArticles()).rejects.toThrowError();

      expect(awsServiceMock.sendTokenExpirationMessage).toBeCalledTimes(1);
      expect(awsServiceMock.sendLimitReachedMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendGenericErrorMessage).toBeCalledTimes(0);
    });

    it('should send limit reached message if feedly limit was reached', async () => {
      axiosMock.onGet('/v3/streams/contents').reply(429, ERROR_RESPONSE(429), FEEDLY_RATE_LIMIT_REACHED_HEADERS);

      await expect(service.getUnreadArticles()).rejects.toThrowError();

      expect(awsServiceMock.sendTokenExpirationMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendLimitReachedMessage).toBeCalledTimes(1);
      expect(awsServiceMock.sendGenericErrorMessage).toBeCalledTimes(0);
    });

    it('should send generic error message in case of unknown error from feedly', async () => {
      axiosMock.onGet('/v3/streams/contents').reply(500, ERROR_RESPONSE(500), FEEDLY_RATE_LIMIT_OK_HEADERS);

      await expect(service.getUnreadArticles()).rejects.toThrowError();

      expect(awsServiceMock.sendTokenExpirationMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendLimitReachedMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendGenericErrorMessage).toBeCalledTimes(1);
    });

    it('should send generic error message in case of unknown error', async () => {
      axiosMock.onGet('/v3/streams/contents').networkError();

      await expect(service.getUnreadArticles()).rejects.toThrowError(/network/i);

      expect(awsServiceMock.sendTokenExpirationMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendLimitReachedMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendGenericErrorMessage).toBeCalledTimes(1);
    });

    it('should send generic error message in case of timeout', async () => {
      axiosMock.onGet('/v3/streams/contents').timeout();

      await expect(service.getUnreadArticles()).rejects.toThrowError(/timeout/);

      expect(awsServiceMock.sendTokenExpirationMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendLimitReachedMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendGenericErrorMessage).toBeCalledTimes(1);
    });
  });

  describe('markArticlesAsRead', () => {
    it('should mark provided articles as read', async () => {
      axiosMock.onPost('/v3/markers').reply(200, {}, FEEDLY_RATE_LIMIT_OK_HEADERS);

      await expect(service.markArticlesAsRead(ARTICLE_IDS)).toBeTruthy();

      // test request body sent to feedly
      const requestBodyString = axiosMock.history.post[0].data;
      expect(requestBodyString).toBeDefined();
      const requestBodyJSON = JSON.parse(requestBodyString);
      expect(requestBodyJSON.entryIds.length).toBe(ARTICLE_IDS.length);
      ARTICLE_IDS.forEach((id) => {
        expect(requestBodyJSON.entryIds).toContain(id);
      });

      // test sns messages
      expect(awsServiceMock.sendTokenExpirationMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendLimitReachedMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendGenericErrorMessage).toBeCalledTimes(0);
    });

    it('should not send request to feedly if no articles are to be marked as read', async () => {
      await expect(service.markArticlesAsRead(NO_ARTICLE_IDS)).toBeTruthy();

      expect(axiosMock.history.post).toHaveLength(0);

      // test sns messages
      expect(awsServiceMock.sendTokenExpirationMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendLimitReachedMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendGenericErrorMessage).toBeCalledTimes(0);
    });

    it('should send token expiration message if token expired', async () => {
      axiosMock.onPost('/v3/markers').reply(401, ERROR_RESPONSE(401), FEEDLY_RATE_LIMIT_OK_HEADERS);

      await expect(service.markArticlesAsRead(ARTICLE_IDS)).rejects.toThrowError();

      expect(awsServiceMock.sendTokenExpirationMessage).toBeCalledTimes(1);
      expect(awsServiceMock.sendLimitReachedMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendGenericErrorMessage).toBeCalledTimes(0);
    });

    it('should send limit reached message if feedly limit was reached', async () => {
      axiosMock.onPost('/v3/markers').reply(429, ERROR_RESPONSE(429), FEEDLY_RATE_LIMIT_REACHED_HEADERS);

      await expect(service.markArticlesAsRead(ARTICLE_IDS)).rejects.toThrowError();

      expect(awsServiceMock.sendTokenExpirationMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendLimitReachedMessage).toBeCalledTimes(1);
      expect(awsServiceMock.sendGenericErrorMessage).toBeCalledTimes(0);
    });

    it('should send generic error message in case of unknown error from feedly', async () => {
      axiosMock.onPost('/v3/markers').reply(500, ERROR_RESPONSE(500), FEEDLY_RATE_LIMIT_OK_HEADERS);

      await expect(service.markArticlesAsRead(ARTICLE_IDS)).rejects.toThrowError();

      expect(awsServiceMock.sendTokenExpirationMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendLimitReachedMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendGenericErrorMessage).toBeCalledTimes(1);
    });

    it('should send generic error message in case of unknown error', async () => {
      axiosMock.onPost('/v3/markers').networkError();

      await expect(service.markArticlesAsRead(ARTICLE_IDS)).rejects.toThrowError(/network/i);

      expect(awsServiceMock.sendTokenExpirationMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendLimitReachedMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendGenericErrorMessage).toBeCalledTimes(1);
    });

    it('should send generic error message in case of timeout', async () => {
      axiosMock.onPost('/v3/markers').timeout();

      await expect(service.markArticlesAsRead(ARTICLE_IDS)).rejects.toThrowError(/timeout/);

      expect(awsServiceMock.sendTokenExpirationMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendLimitReachedMessage).toBeCalledTimes(0);
      expect(awsServiceMock.sendGenericErrorMessage).toBeCalledTimes(1);
    });
  });
});
