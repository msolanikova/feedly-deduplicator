# feedly-deduplicator
Connects to feedly account periodically and marks all duplicated (unread) articles as read.

Deployed as AWS Lambda scheduled via CloudWatch EventBridge rule. Duplicated articles are evaluated in memory (no DB), so this solution is suitable for cases with reasonable amount of unread articles (assuming up to ~300 unread articles that need to be processes). For cases with high number of unread articles to be processes this solution should be updated to use DB for checking uniqueness.

## Unique check
Uniqueness of the article is checked ONLY by its URL (no content checking). In response from Feedly API it's `originId` field.  

## Build
* `tsc` compiles .ts files to .js files in dist folder

## Deploy to AWS
* `npm run dist` compiles .ts and copies everything necessary to dist folder
* `sam build` prepares the package using AWS SAM tool
* `sam deploy` deploys

## Run Lambda function locally
* `tsc` compiles .ts
* `sam build` prepares the package
* `sam local invoke -e events/events.json` invokes function configured in [`template.yaml`](template.yaml) using [event file](events/event.json). This requires docker service to be running. 
