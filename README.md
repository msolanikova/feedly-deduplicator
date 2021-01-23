# feedly-deduplicator
Connects to feedly account periodically and marks all duplicated (unread) articles as read

Deployed as AWS Lambda scheduled via CloudWatch EventBridge rule

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
