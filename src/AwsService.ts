import { FeedlyAuth } from './models/FeedlyAuth';
import { GetSecretValueCommand, GetSecretValueCommandOutput, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { logger } from './LoggingUtils';

const log = logger(__filename);

/**
 * Returns feedly data for authentication from AWS Secrets Manager
 */
export const getFeedlyAuth = async (): Promise<FeedlyAuth> => {
  const secretsManager = new SecretsManagerClient({});
  const command = new GetSecretValueCommand({
    SecretId: process.env.FEEDLY_AUTH_SECRET_NAME ?? '',
  });
  const secretResponse = (await secretsManager.send(command)) as GetSecretValueCommandOutput;
  const feedlyAuthJson = JSON.parse(secretResponse.SecretString ?? '{}');

  return new FeedlyAuth(feedlyAuthJson['token'], feedlyAuthJson['user']);
};

/**
 * Sends token expiration message to AWS SNS
 * @param error error stringified json error that is sent in message
 */
export const sendTokenExpirationMessage = async (error: string): Promise<void> => {
  const message = `Feedly token expired! Generate a new one here: https://developer.feedly.com/v3/developer/\n\n${error}`;
  const subject = 'Feedly De-duplicator: Feedly token for de-duplicator expired';
  await sendSnsMessage(message, subject);
};

/**
 * Sends limit reached message to AWS SNS
 * @param error stringified json error that is sent in message
 */
export const sendLimitReachedMessage = async (error: string): Promise<void> => {
  const message = `Feedly API limit has been reached! It resets in the midnight and de-duplicator can be used tomorrow again\n\n${error}`;
  const subject = 'Feedly De-duplicator: Feedly API limit reached';
  await sendSnsMessage(message, subject);
};

/**
 * Sends generic error message to AWS SNS
 * @param error
 */
export const sendGenericErrorMessage = async (error: string): Promise<void> => {
  const message = error;
  const subject = 'Feedly De-duplicator: generic error';
  await sendSnsMessage(message, subject);
};

const sendSnsMessage = async (message: string, subject: string): Promise<void> => {
  const params = {
    Message: message,
    Subject: subject,
    TopicArn: process.env.NOTIFICATION_TOPIC_ARN ?? '',
  };

  const sns = new SNSClient({});
  const command = new PublishCommand(params);
  await sns.send(command);
  log.debug(`Message with subject [${subject}] was sent`);
};
