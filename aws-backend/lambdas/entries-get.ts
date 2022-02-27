
import * as AWS from 'aws-sdk';

const GROUP_PRIMARY_KEY = process.env.GROUP_PRIMARY_KEY || '';
const GROUP_TABLE_NAME = process.env.GROUP_TABLE_NAME || '';
const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '';
const CHALLENGE_TABLE_NAME = process.env.CHALLENGE_TABLE_NAME || '';
const CHALLENGE_PRIMARY_KEY = process.env.CHALLENGE_PRIMARY_KEY || '';

const ENTRIES_TABLE_NAME = process.env.ENTRIES_TABLE_NAME || '';


const db = new AWS.DynamoDB.DocumentClient();


export const handler = async (event: any = {}): Promise<any> => {
    try {

        const username = event.requestContext.authorizer.claims["cognito:username"]
        const body = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
        console.log(body)


        // check inputs
        var groupId = body.groupId
        if (groupId === undefined || groupId === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no groupId provided`
            };
        }
        var challengeId = body.challengeId
        if (challengeId === undefined || challengeId === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no challengeId provided`
            };
        }


        //check some business logic

        //check if group exists
        var result: any = await getGroup(groupId)
        if (result === null) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: JSON.stringify("group does not exist")
            };
        }

        //check if person is owner or member
        if (result.groupOwner != username && !result.groupMember.includes(username)) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: JSON.stringify("you not owner or member of the group. maybe you are blocked?")
            };
        }
        //implicitly check if user is member is blocked

        //check if challenge exists
        console.log("group: " + JSON.stringify(result))
        result = await getChallenge(challengeId)
        console.log("challenge: " + JSON.stringify(result))
        if (result === undefined || result.groupId !== groupId) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: JSON.stringify("cannot find challenge in group")
            };
        }


        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
            },
            body: JSON.stringify(await getEntries(groupId, challengeId,username))
        };
    } catch (error) {
        console.log("Captured error: " + JSON.stringify(error))
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
            },
            body: JSON.stringify(error)
        };
    }
};

async function getGroup(groupId: string) {
    const params = {
        TableName: GROUP_TABLE_NAME,
        Key: {
            [GROUP_PRIMARY_KEY]: groupId
        }
    };
    const queryResponse = await db.get(params).promise();
    return queryResponse.Item;
}


async function getChallenge(challengeId: string) {
    console.log("Fetching challenge with id: " + challengeId)
    const params = {
        TableName: CHALLENGE_TABLE_NAME,
        Key: {
            [CHALLENGE_PRIMARY_KEY]: challengeId
        }
    };
    console.log("Params: " + JSON.stringify(params))
    const queryResponse = await db.get(params).promise();
    console.log("Found challenge: " + JSON.stringify(queryResponse))
    return queryResponse.Item;
}



async function getEntries(groupId: string, challengeId: string, username: string) {

    console.log("Searching for entries for challenge with id " + challengeId)
    var params = {
        TableName: ENTRIES_TABLE_NAME,
        ExpressionAttributeValues: {
            ':groupId': groupId,
            ':challengeId': challengeId
        },
        FilterExpression: `groupId = :groupId AND challengeId = :challengeId`
    };
    console.log(JSON.stringify(params))
    const queryResponse = await db.scan(params).promise();

    console.log("Found items: " + JSON.stringify(queryResponse.Items))

    var entries: any = queryResponse.Items

    var group: any = await getGroup(groupId)
    entries = entries.filter((entry: any) => !group.blockedMember.includes(entry.username))
    entries.forEach((entry: any) => {
        if (entry.username !== username) {
            delete entry.activitySummary.details
        }
    });
    return entries;
}