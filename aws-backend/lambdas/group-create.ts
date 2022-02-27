import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const GROUP_PRIMARY_KEY = process.env.GROUP_PRIMARY_KEY || '';
const GROUP_TABLE_NAME = process.env.GROUP_TABLE_NAME || '';
const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '';

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`
const DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

const db = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any = {}): Promise<any> => {
    try {
        const username = event.requestContext.authorizer.claims["cognito:username"]

        const body = typeof event.body == 'object' ? event.body : JSON.parse(event.body);

        var groupName = body.groupName
        if (groupName === undefined || groupName === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "no groupName provided"
            };

        }


        const createdGroup = await createNewGroup(username, groupName)


        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
            },
            body: JSON.stringify(createdGroup)
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

async function createNewGroup(username: string, groupName: string) {

    console.log("Creating new group with name " + groupName + " and groupOwner " + username)


    const newGroup: any = {
        "groupName": groupName,
        "groupOwner": username,
        "groupMember": [],
        "blockedMember": []
    }
    newGroup[GROUP_PRIMARY_KEY] = uuidv4();

    const params = {
        TableName: GROUP_TABLE_NAME,
        Item: newGroup,
        ReturnValues: "ALL_OLD"
    };


    await db.put(params).promise();
    console.log("Created new group: " + JSON.stringify(newGroup))
    return await getGroupsOfaUser(username);

}

async function getGroupsOfaUser(username: string) {
    console.log("Searching for groups where " + username + " is member or owner")


    const db = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: "group",
        ExpressionAttributeValues: {
            ':username': username
        },
        FilterExpression: 'groupOwner = :username OR contains(groupMember, :username)'
    };
    console.log(JSON.stringify(params))
    const queryResponse = await db.scan(params).promise();

    console.log("Found items: " + JSON.stringify(queryResponse.Items))
    return queryResponse.Items;
}