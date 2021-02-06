import * as AwsService from '../AwsService';
import { FeedlyService } from '../FeedlyService';
import { FeedlyAuth } from '../models/FeedlyAuth';
import {
  FEEDLY_RESPONSE_OK_MULTIPLE_ITEMS_2_DUPLICATES,
  FEEDLY_RESPONSE_OK_MULTIPLE_ITEMS_2_DUPLICATES_WITH_CONTINUATION_PAGE1,
  FEEDLY_RESPONSE_OK_MULTIPLE_ITEMS_2_DUPLICATES_WITHOUT_CONTINUATION_PAGE2,
  TOKEN,
  USER,
} from './TestData';
import { lambdaHandler } from '../LambdaHandler';

jest.mock('../AwsService');
jest.mock('../FeedlyService');
const awsServiceMock = AwsService as jest.Mocked<typeof AwsService>;
const feedlyServiceMock = FeedlyService as jest.MockedClass<typeof FeedlyService>;

describe('index', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe('lambdaHandler', () => {
    it('should mark all duplicated articles as read retrieved in single feedly call', async () => {
      awsServiceMock.getFeedlyAuth.mockResolvedValue(new FeedlyAuth(TOKEN, USER));
      feedlyServiceMock.prototype.getUnreadArticles.mockImplementation(() => Promise.resolve(FEEDLY_RESPONSE_OK_MULTIPLE_ITEMS_2_DUPLICATES));

      await lambdaHandler();

      expect(feedlyServiceMock.prototype.markArticlesAsRead).toBeCalledTimes(1);
      expect(feedlyServiceMock.prototype.markArticlesAsRead.mock.calls[0][0]).toHaveLength(2);
      expect(feedlyServiceMock.prototype.markArticlesAsRead.mock.calls[0][0]).toContain('duplicatedId1');
      expect(feedlyServiceMock.prototype.markArticlesAsRead.mock.calls[0][0]).toContain('duplicatedId2');
    });

    it('should mark all duplicated articles as read retrieved in multiple feedly calls', async () => {
      awsServiceMock.getFeedlyAuth.mockResolvedValue(new FeedlyAuth(TOKEN, USER));
      feedlyServiceMock.prototype.getUnreadArticles.mockImplementation((continuation) => {
        if (!continuation) {
          return Promise.resolve(FEEDLY_RESPONSE_OK_MULTIPLE_ITEMS_2_DUPLICATES_WITH_CONTINUATION_PAGE1);
        } else if ('page2' == continuation) {
          return Promise.resolve(FEEDLY_RESPONSE_OK_MULTIPLE_ITEMS_2_DUPLICATES_WITHOUT_CONTINUATION_PAGE2);
        } else {
          return Promise.reject();
        }
      });

      await lambdaHandler();

      expect(feedlyServiceMock.prototype.getUnreadArticles).toBeCalledTimes(2);
      expect(feedlyServiceMock.prototype.markArticlesAsRead).toBeCalledTimes(1);
      expect(feedlyServiceMock.prototype.markArticlesAsRead.mock.calls[0][0]).toHaveLength(3);
      expect(feedlyServiceMock.prototype.markArticlesAsRead.mock.calls[0][0]).toContain('duplicatedId1');
      expect(feedlyServiceMock.prototype.markArticlesAsRead.mock.calls[0][0]).toContain('duplicatedId2');
      expect(feedlyServiceMock.prototype.markArticlesAsRead.mock.calls[0][0]).toContain('duplicatedId3');
    });

    it('should stop requesting feedly after REQUEST_LIMIT', async () => {
      awsServiceMock.getFeedlyAuth.mockResolvedValue(new FeedlyAuth(TOKEN, USER));
      feedlyServiceMock.prototype.getUnreadArticles.mockImplementation(() => {
        return Promise.resolve(FEEDLY_RESPONSE_OK_MULTIPLE_ITEMS_2_DUPLICATES_WITH_CONTINUATION_PAGE1);
      });

      await lambdaHandler();

      expect(feedlyServiceMock.prototype.getUnreadArticles).toBeCalledTimes(15);
    });
  });
});
