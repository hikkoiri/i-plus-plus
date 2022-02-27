import * as AWS from 'aws-sdk';

const GROUP_PRIMARY_KEY = process.env.GROUP_PRIMARY_KEY || '';
const GROUP_TABLE_NAME = process.env.GROUP_TABLE_NAME || '';
const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '';
const CHALLENGE_TABLE_NAME = process.env.CHALLENGE_TABLE_NAME || '';
const CHALLENGE_PRIMARY_KEY = process.env.CHALLENGE_PRIMARY_KEY || '';


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

        //check if person emitting request is owner
        if (result.groupOwner != username) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: JSON.stringify("only group owners are allowed to perform this action")
            };
        }
        //implicitly check if user is member or blocked. but owner cannot be blocked, so its fine

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

        // check if any other challenge is active
        result = await getChallengesOfGroup(groupId)
        result = result.filter((challenge: any) => challenge.archived === false)

        if (result > 0) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: JSON.stringify("one challenge is already active")
            };
        }

        await unarchiveChallenge(challengeId)

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
            },
            body: JSON.stringify(await getChallengesOfGroup(groupId))
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

async function unarchiveChallenge(challengeId: string) {

    console.log("Unarchiving challenge with id " + challengeId)


    const params: any = {
        TableName: CHALLENGE_TABLE_NAME,
        Key: {
            [CHALLENGE_PRIMARY_KEY]: challengeId
        },
        ReturnValues: 'ALL_NEW',
        UpdateExpression: 'set archived = :newState',
        ExpressionAttributeValues: {
            ':newState': false
        }
    }
    console.log("update params: " + JSON.stringify(params))
    try {
        const queryResponse = await db.update(params).promise();
        console.log("Unarchived challenge: " + JSON.stringify(queryResponse))
        return queryResponse.Attributes;
    } catch (dbError: any) {
        throw dbError;
    }
}


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
    const params = {
        TableName: CHALLENGE_TABLE_NAME,
        Key: {
            [CHALLENGE_PRIMARY_KEY]: challengeId
        }
    };
    const queryResponse = await db.get(params).promise();
    return queryResponse.Item;
}


async function getChallengesOfGroup(groupId: string) {

    console.log("Searching for challenges where of group with id: " + groupId)
    var params = {
        TableName: CHALLENGE_TABLE_NAME,
        ExpressionAttributeValues: {
            ':groupId': groupId
        },
        FilterExpression: `groupId = :groupId`
    };
    console.log(JSON.stringify(params))
    const queryResponse = await db.scan(params).promise();

    console.log("Found items: " + JSON.stringify(queryResponse.Items))
    return queryResponse.Items;
}