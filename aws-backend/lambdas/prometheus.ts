import * as AWS from 'aws-sdk';

const COUNTER_TABLE_NAME = process.env.COUNTER_TABLE_NAME || '';
const COUNTER_PRIMARY_KEY = process.env.COUNTER_PRIMARY_KEY || '';
const COUNTER_PRIMARY_KEY_VALUE = process.env.COUNTER_PRIMARY_KEY_VALUE || '';
const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '';

const db = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any = {}): Promise<any> => {
    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
        },
        body: "count " + await getCurrentCount()
    };
};


async function getCurrentCount() {
    const params = {
        TableName: COUNTER_TABLE_NAME,
        Key: {
            [COUNTER_PRIMARY_KEY]: COUNTER_PRIMARY_KEY_VALUE
        }
    };
    const response = await db.get(params).promise();
    if (response.Item !== undefined) {
        return response.Item.currentCount
    }
    return 0;
}
