import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const COUNTER_TABLE_NAME = process.env.COUNTER_TABLE_NAME!;
const COUNTER_PRIMARY_KEY = process.env.COUNTER_PRIMARY_KEY!;

const db = new DynamoDBClient();


interface Badge {
    fontType: string;
    leftText: string;
    leftTextColor: string;
    leftBackgroundColor: string;
    rightText: string;
    rightTextColor: string;
    rightBackgroundColor: string;
    radius: number;
}

export const handler = async (event: any = {}): Promise<any> => {

    let origin;
    const queryOrigin = event.queryStringParameters?.origin;
    if (queryOrigin) {
        console.log("Origin found in query parameters: " + queryOrigin);
        origin = queryOrigin;
    }
    else {
        origin = event.headers?.Origin || event.headers?.origin || "unknown";
        console.log("Origin found from header" + origin)
    }

    var current = await getCurrentCount(origin)
    console.log("Retrieved record from database to: " + JSON.stringify(current))

    var bumped = {
        ...current,
        dailyCount: current.dailyCount + 1,
    }
    console.log("Updating value in database to: " + JSON.stringify(bumped))
    await updateCount(bumped)





    // now check the query parameter for visual configuration
    const language = event.queryStringParameters?.language || "en";
    let leftText = event.queryStringParameters?.leftText;
    if (!leftText) {
        leftText = language === "de" ? "Aufrufe (täglich / insgesamt)" : "hits (daily / all time)";
    }
    const leftBackgroundColor = event.queryStringParameters?.leftBackgroundColor || "#333333"
    const rightBackgroundColor = event.queryStringParameters?.rightBackgroundColor || "darkgreen"


    const rightText = `${bumped.dailyCount} / ${bumped.allTimeCount}`;
    const badge: Badge = {
        fontType: "Verdana",
        rightTextColor: "#fff",
        leftTextColor: "#fff",
        leftText,
        leftBackgroundColor,
        rightText,
        rightBackgroundColor,
        radius: 5,
    };

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Content-Type": "image/svg+xml"
        },
        body: renderFlatBadge(badge)
    };

}


function renderFlatBadge(badge: Badge): string {

    const defaultBadgeHeight = 20;
    const defaultFontSize = 12;
    const leftWidth = badge.leftText.length * 7; // Approximation for text width
    const rightWidth = badge.rightText.length * 8; // Approximation for text width

    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${leftWidth + rightWidth}" height="${defaultBadgeHeight}">
        <rect x="${badge.radius}" width="${leftWidth - badge.radius}" height="${defaultBadgeHeight}" fill="${badge.leftBackgroundColor}" />
        <rect width="${leftWidth}" height="${defaultBadgeHeight}" fill="${badge.leftBackgroundColor}" ry="${badge.radius}" rx="${badge.radius}"/>
        <text x="${2 * badge.radius}" y="${14}" fill="${badge.leftTextColor}" textAnchor="middle" font-family="${badge.fontType}" font-size="${defaultFontSize}">
            ${badge.leftText}
        </text>
        <rect x="${leftWidth}" width="${rightWidth - badge.radius}" height="${defaultBadgeHeight}" fill="${badge.rightBackgroundColor}"/>
        <rect x="${leftWidth}" width="${rightWidth}" height="${defaultBadgeHeight}" fill="${badge.rightBackgroundColor}" ry="${badge.radius}" rx="${badge.radius}" />
        <text x="${leftWidth + badge.radius}" y="${14}" fill="${badge.rightTextColor}" textAnchor="middle" font-family="${badge.fontType}" font-size="${defaultFontSize}">
            ${badge.rightText}
        </text>
    </svg>`
}


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
