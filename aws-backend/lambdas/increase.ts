import * as AWS from 'aws-sdk';

const COUNTER_TABLE_NAME = process.env.COUNTER_TABLE_NAME || '';
const COUNTER_PRIMARY_KEY = process.env.COUNTER_PRIMARY_KEY || '';
const COUNTER_PRIMARY_KEY_VALUE = process.env.COUNTER_PRIMARY_KEY_VALUE || '';
const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '';

const db = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any = {}): Promise<any> => {
    console.log("Increasing count number")
    var currentCount = await getCurrentCount()
    console.log("Got current number from database: " + currentCount)
    if (currentCount === undefined) {
        console.log("No object found. Creating one.")
        currentCount = await createInitialObject()
    } else {
        currentCount = await updateCount(currentCount + 1)
    }
    console.log("Updated value in database to: " + currentCount)

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
        },
        body: currentCount
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
    return response.Item;
}

async function createInitialObject() {
    const item = {
        [COUNTER_PRIMARY_KEY]: COUNTER_PRIMARY_KEY_VALUE,
        currentCount: 1
    }
    const params = {
        TableName: COUNTER_TABLE_NAME,
        Item: item
    };
    await db.put(params).promise();
    return item.currentCount
}

async function updateCount(updatedCount: number) {
    const params: any = {
        TableName: COUNTER_TABLE_NAME,
        Key: {
            [COUNTER_PRIMARY_KEY]: COUNTER_PRIMARY_KEY_VALUE
        },
        ReturnValues: 'ALL_NEW',
        UpdateExpression: 'set currentCount = :updatedCount',
        ExpressionAttributeValues: {
            ':updatedCount': updatedCount
        }
    }
    const queryResponse = await db.update(params).promise();
    const updatedObject: any = queryResponse.Attributes
    return updatedObject.currentCount;
}
