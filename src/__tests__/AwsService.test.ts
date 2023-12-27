import { GetParameterCommandOutput, SSMClient } from '@aws-sdk/client-ssm';
import { getFeedlyAuth, sendGenericErrorMessage, sendLimitReachedMessage, sendTokenExpirationMessage } from '../AwsService';
import { SNSClient } from '@aws-sdk/client-sns';

jest.mock('@aws-sdk/client-ssm');
jest.mock('@aws-sdk/client-sns');
const ssmClient = SSMClient as jest.MockedClass<typeof SSMClient>;
const sns = SNSClient as jest.MockedClass<typeof SNSClient>;

describe('AwsService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getFeedlyAuth', () => {
    it('should return proper FeedlyAuth if secret value is found', async () => {
      const mockOutput = { Parameter: { Value: 'testParam' } } as GetParameterCommandOutput;
      ssmClient.prototype.send.mockImplementation(() => mockOutput);

      const feedlyAuth = await getFeedlyAuth();

      expect(feedlyAuth).toBeTruthy();
      expect(feedlyAuth['user']).toMatch('testParam');
      expect(feedlyAuth['token']).toMatch('testParam');
    });

    it('should throw error if secret value is not found', async () => {
      ssmClient.prototype.send.mockImplementation(() => Promise.reject(new Error('resource not found')));

      await expect(getFeedlyAuth()).rejects.toThrowError(/resource/);
    });
  });

  describe('sendTokenExpirationMessage', () => {
    it('should send token expiration message when called', async () => {
      sns.prototype.send.mockImplementation(() => Promise.resolve());

      await sendTokenExpirationMessage('token expiration error');

      expect(sns.prototype.send).toBeCalledTimes(1);
    });

    it('should send throw error if sns throws error', async () => {
      sns.prototype.send.mockImplementation(() => Promise.reject(new Error('')));

      await expect(sendTokenExpirationMessage('token expiration error')).rejects.toThrowError();
    });
  });

  describe('sendLimitReachedMessage', () => {
    it('should send limit reached message when called', async () => {
      sns.prototype.send.mockImplementation(() => Promise.resolve());

      await sendLimitReachedMessage('limit reached error');

      expect(sns.prototype.send).toBeCalledTimes(1);
    });

    it('should send throw error if sns throws error', async () => {
      sns.prototype.send.mockImplementation(() => Promise.reject(new Error('')));

      await expect(sendLimitReachedMessage('limit reached error')).rejects.toThrowError();
    });
  });

  describe('sendGenericErrorMessage', () => {
    it('should send generic error message when called', async () => {
      sns.prototype.send.mockImplementation(() => Promise.resolve());

      await sendGenericErrorMessage('generic error');

      expect(sns.prototype.send).toBeCalledTimes(1);
    });

    it('should send throw error if sns throws error', async () => {
      sns.prototype.send.mockImplementation(() => Promise.reject(new Error('')));

      await expect(sendGenericErrorMessage('limit reached error')).rejects.toThrowError();
    });
  });
});
