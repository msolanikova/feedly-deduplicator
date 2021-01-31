import { FeedlyAuth } from './models/FeedlyAuth';
import SecretsManager from 'aws-sdk/clients/secretsmanager';
import SNS from 'aws-sdk/clients/sns';

export class AwsService {
  /**
   * Returns feedly data for authentication from AWS Secrets Manager
   */
  getFeedlyAuth = async (): Promise<FeedlyAuth> => {
    const params = {
      SecretId: process.env.FEEDLY_AUTH_SECRET_NAME ?? '',
    };
    const secretsManager = new SecretsManager();
    const secretResponse = await secretsManager.getSecretValue(params).promise();
    const feedlyAuthJson = JSON.parse(secretResponse.SecretString ?? '{}');

    return new FeedlyAuth(feedlyAuthJson['token'], feedlyAuthJson['user']);
  };

  /**
   * Sends token expiration message to AWS SNS
   * @param error error stringified json error that is sent in message
   */
  sendTokenExpirationMessage = async (error: string): Promise<void> => {
    const message = `Feedly token expired! Generate a new one here: https://developer.feedly.com/v3/developer/\n\n${error}`;
    const subject = 'Feedly De-duplicator: Feedly token for de-duplicator expired';
    await this.sendSnsMessage(message, subject);
  };

  /**
   * Sends limit reached message to AWS SNS
   * @param error stringified json error that is sent in message
   */
  sendLimitReachedMessage = async (error: string): Promise<void> => {
    const message = `Feedly API limit has been reached! It resets in the midnight and de-duplicator can be used tomorrow again\n\n${error}`;
    const subject = 'Feedly De-duplicator: Feedly API limit reached';
    await this.sendSnsMessage(message, subject);
  };

  /**
   * Sends generic error message to AWS SNS
   * @param error
   */
  sendGenericErrorMessage = async (error: string): Promise<void> => {
    const message = error;
    const subject = 'Feedly De-duplicator: generic error';
    await this.sendSnsMessage(message, subject);
  };

  private sendSnsMessage = async (message: string, subject: string): Promise<void> => {
    const params = {
      Message: message,
      Subject: subject,
      TopicArn: process.env.NOTIFICATION_TOPIC_ARN ?? '',
    };

    const sns = new SNS();
    await sns.publish(params).promise();
  };
}
