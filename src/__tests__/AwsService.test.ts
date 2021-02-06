import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { getFeedlyAuth, sendGenericErrorMessage, sendLimitReachedMessage, sendTokenExpirationMessage } from '../AwsService';
import { SECRET_MANAGER_RESPONSE, TOKEN, USER } from './TestData';
import { SNSClient } from '@aws-sdk/client-sns';

jest.mock('@aws-sdk/client-secrets-manager');
jest.mock('@aws-sdk/client-sns');
const secretsManager = SecretsManagerClient as jest.MockedClass<typeof SecretsManagerClient>;
const sns = SNSClient as jest.MockedClass<typeof SNSClient>;

describe('AwsService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getFeedlyAuth', () => {
    it('should return proper FeedlyAuth if secret value is found', async () => {
      secretsManager.prototype.send.mockImplementation(() => Promise.resolve(SECRET_MANAGER_RESPONSE));

      const feedlyAuth = await getFeedlyAuth();

      expect(feedlyAuth).toBeTruthy();
      expect(feedlyAuth['user']).toMatch(USER);
      expect(feedlyAuth['token']).toMatch(TOKEN);
    });

    it('should throw error if secret value is not found', async () => {
      secretsManager.prototype.send.mockImplementation(() => Promise.reject(new Error('resource not found')));

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
