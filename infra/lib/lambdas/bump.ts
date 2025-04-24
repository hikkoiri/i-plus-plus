import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
const COUNTER_TABLE_NAME = process.env.COUNTER_TABLE_NAME!;
const COUNTER_PRIMARY_KEY = process.env.COUNTER_PRIMARY_KEY!;

const db = new DynamoDBClient();

export const handler = async (event: any = {}): Promise<any> => {
    console.log("Received event: " + JSON.stringify(event));

    let origin;
    const queryOrigin = event.queryStringParameters?.origin;
    if (queryOrigin) {
        console.log("Origin found in query parameters: " + queryOrigin);
        origin = queryOrigin;
    }
    else {
        origin = event.headers?.Origin || event.headers?.origin || "unknown";
        console.log("Origin found from header: " + origin)
    }

    var current = await getCurrentCount(origin)
    console.log("Retrieved record from database to: " + JSON.stringify(current))

    var bumped = {
        ...current,
        dailyCount: current.dailyCount + 1,
    }
    console.log("Updating value in database to: " + JSON.stringify(bumped))
    await updateCount(bumped)

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(bumped)
    };
};


async function getCurrentCount(origin: string): Promise<any> {
    const params = {
        TableName: COUNTER_TABLE_NAME,
        Key: {
            [COUNTER_PRIMARY_KEY]: { S: origin }
        }
    };
    const command = new GetItemCommand(params);
    const response = await db.send(command);
    if (!response.Item) {
        return {
            origin,
            allTimeCount: 0,
            dailyCount: 0
        };
    }
    else {
        return {
            origin,
            allTimeCount: parseInt(response.Item.allTimeCount.N!),
            dailyCount: parseInt(response.Item.dailyCount.N!)
        };
    }
}


async function updateCount(bumped: any): Promise<void> {
    const params = {
        TableName: COUNTER_TABLE_NAME,
        Item: {
            [COUNTER_PRIMARY_KEY]: { S: bumped.origin },
            allTimeCount: { N: bumped.allTimeCount.toString() },
            dailyCount: { N: bumped.dailyCount.toString() }
        }
    };
    const command = new PutItemCommand(params);
    await db.send(command);
}
