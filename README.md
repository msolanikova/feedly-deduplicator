# feedly-deduplicator
[Feedly](https://feedly.com) is a great news aggregator application. In the paid version Feedly provides the AI Research Assistant which (except of many other skills) has capability of removing duplicated articles based on their content. However, it's not available in their free version.

## Use case for feedly-deduplicator
Some pages provide multiple rss feeds based on article category. Sometimes single article belongs to multiple categories, so it appears in more than one rss feed. It has same title, same content, same URL, but it appears multiple times in Feedly.

## How feedly-deduplicator works
It connects to your feedly account periodically and marks all duplicated (unread) articles as read. Duplicated articles are evaluated in memory (no DB is used), so this solution is suitable for cases with reasonable amount of unread articles (assuming up to ~1000 unread articles that need to be processed). For cases with high number of unread articles to be processes this solution should be updated to use DB for checking uniqueness.

### Uniqueness check
Uniqueness of the article is checked ONLY by its URL (no content checking) using `originId` field from response of [Feedly Streams API](https://developer.feedly.com/v3/streams/).

## Infrastructure
Feedly-deduplicator can be deployed to an AWS as AWS Lambda scheduled via CloudWatch EventBridge rule. 

### Build
* `tsc` compiles .ts files to .js files in dist folder

### Deploy to AWS using Github Actions
* fork repo
* Github Actions definition is in `.github/workflows/main.yml`
  * runs unit tests
  * prepare everything for deployment
  * builds AWS SAM
  * deploys via AWS SAM
  * invokes lambda to verify everything works after deployment
* expects these values in Github project's Secrets (Settings -> Secrets)
  * AWS_ACCESS_KEY_ID - access key with permissions to target AWS account
  * AWS_SECRET_ACCESS_KEY - secret access key with permissions to target AWS account
  * AWS_DEFAULT_REGION - region to deploy feedly-deduplicator to

### Deploy to AWS manually
* `npm test` runs jest unit tests
* `npm run dist` compiles .ts and copies everything necessary to dist folder
* `sam build` prepares the package using AWS SAM tool
* `sam deploy --parameter-overrides <parameter key>=<parameter value>` deploys and creates new CF stack (use `--guided` switch when deploying the first time)
* Parameters:
  * (mandatory) `NotificationEmail` - email for notifications about errors 
  * (optional) `FeedlyAuthSecretStringName` - name of the secret string holding feedly auth data. Default: `FeedlyAuth`
  * (optional) `FeedlyCheckRuleName` - name of the event rule for periodically triggering the de-duplicator. Default: `feedly-check`
  * (optional) `FeedlyCheckRuleSchedule` - the schedule of de-duplicator. Default: `cron(0 4/2 * * ? *)` (every 2 hours starting at 4am UTC)
    * watch out! there are spaces in cron schedule and you may need to escape them. Also in such case you may use cloudformation format for parameter overrides E.g. `--parameter-overrides ParameterKey=FeedlyCheckRuleSchedule,ParameterValue="cron(0\ 4/2\ *\ *\ ?\ *)"`
    * also don't configure feedly-deduplicator to run too often as there are limits on Feedly API
  * (optional) `NotificationSnsTopicName` - name of the notifications SNS topic. Default: `feedly-deduplicator-notifications`

### Run Lambda function locally
* set necessary environment variables (`NOTIFICATION_TOPIC_ARN`, `FEEDLY_AUTH_SECRET_NAME`)
* `npm run dist` compiles .ts and copies everything necessary to dist folder
* `sam build` prepares the package
* `sam local invoke -e events/event.json` invokes function configured in [`template.yaml`](template.yaml) using [event file](events/event.json). This requires docker service to be running. 
