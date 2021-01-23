import {ScheduledEvent} from "aws-lambda";

export const lambdaHandler = async (event: ScheduledEvent): Promise<void> => {
  console.log("Event:")
  console.log(event);
}