
import * as AWS from 'aws-sdk';

const GROUP_PRIMARY_KEY = process.env.GROUP_PRIMARY_KEY || '';
const GROUP_TABLE_NAME = process.env.GROUP_TABLE_NAME || '';
const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '';

const CHALLENGE_TABLE_NAME = process.env.CHALLENGE_TABLE_NAME || '';


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
