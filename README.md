# feedly-deduplicator
Connects to feedly account periodically and marks all duplicated (unread) articles as read.

Deployed as AWS Lambda scheduled via CloudWatch EventBridge rule. Duplicated articles are evaluated in memory (no DB), so this solution is suitable for cases with reasonable amount of unread articles (assuming up to ~300 unread articles that need to be processes). For cases with high number of unread articles to be processes this solution should be updated to use DB for checking uniqueness.

## Uniqueness check
Uniqueness of the article is checked ONLY by its URL (no content checking) using `originId` field from response of Feedly Streams API.  

## Build
* `tsc` compiles .ts files to .js files in dist folder

## Deploy to AWS
* `npm run dist` compiles .ts and copies everything necessary to dist folder
* `sam build` prepares the package using AWS SAM tool
* `sam deploy --parameter-overrides <parameter key>=<parameter value>` deploys and creates new CF stack (use `--guided` switch when deploying the first time)
* Parameters:
  * (mandatory) `NotificationEmail` - email for notifications about errors 
  * (optional) `FeedlyAuthSecretStringName` - name of the secret string holding feedly auth data. Default: `FeedlyAuth`
  * (optional) `FeedlyCheckRuleName` - name of the event rule for periodically triggering the de-duplicator. Default: `feedly-check`
  * (optional) `FeedlyCheckRuleSchedule` - the schedule of de-duplicator. Default: `cron(0 4/5 * * ? *)` (every 5 hours starting at 4am UTC)
  * (optional) `NotificationSnsTopicName` - name of the notifications SNS topic. Default: `feedly-deduplicator-notifications`

## Run Lambda function locally
* set necessary environment variables (`NOTIFICATION_TOPIC_ARN`, `FEEDLY_AUTH_SECRET_NAME`)
* `tsc` compiles .ts
* `sam build` prepares the package
* `sam local invoke -e events/events.json` invokes function configured in [`template.yaml`](template.yaml) using [event file](events/event.json). This requires docker service to be running. 
