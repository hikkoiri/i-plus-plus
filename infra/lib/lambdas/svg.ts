import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
const COUNTER_TABLE_NAME = process.env.COUNTER_TABLE_NAME!;
const COUNTER_PRIMARY_KEY = process.env.COUNTER_PRIMARY_KEY!;

const db = new DynamoDBClient();

export const handler = async (event: any = {}): Promise<any> => {

    // TODO continue here
}
