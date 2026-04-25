import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SQSEvent } from "aws-lambda";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const processEvent = async (event: SQSEvent) => {
  for (const record of event.Records) {
    try {
      // Parse the incoming SQS message body
      const payload = JSON.parse(record.body);
      console.log("Processing job payload:", payload);

      // Perform a write operation to DynamoDB
      const dbParams = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          id: randomUUID(),
          title: payload.title || "Untitled Job",
          status: "COMPLETED",
          processedAt: new Date().toISOString(),
          originalData: payload,
        },
      };

      await docClient.send(new PutCommand(dbParams));
      console.log("Successfully wrote event to DynamoDB");

    } catch (error) {
      console.error("Error processing SQS record:", error);
      // Depending on requirements, we either swallow the error or throw to trigger SQS retry (DLQ)
      throw error; 
    }
  }
};
