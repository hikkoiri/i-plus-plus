
import * as AWS from 'aws-sdk';

const GROUP_PRIMARY_KEY = process.env.GROUP_PRIMARY_KEY || '';
const GROUP_TABLE_NAME = process.env.GROUP_TABLE_NAME || '';
const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '';
const db = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any = {}): Promise<any> => {


    try {
        const username = event.requestContext.authorizer.claims["cognito:username"]
        const body = typeof event.body == 'object' ? event.body : JSON.parse(event.body);

        const groupId = body._id
        if (groupId === undefined || groupId === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "no _id provided"
            };
        }

        //check if group exists
        console.log("Trying to get group with id: " + groupId)
        var result = await getGroup(groupId)
        console.log("Found: " + JSON.stringify(result))
        if (result === undefined) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "group does not exist"
            };
        }

        //check if person emitting request is owner
        console.log("Checking if user is groupOwner")
        if (result.groupOwner !== username) {
            console.log("user is NOT groupOwner")

            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "only group owners are allowed to perform this action"
            };
        }
        console.log("user is groupOwner")
        await deleteGroup(groupId)

        const groups = await getGroupsOfaUser(username)

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
            },
            body: JSON.stringify(groups)
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




async function deleteGroup(groupId: string) {
    console.log("Deleting group with id: " + groupId)
    const params = {
        TableName: GROUP_TABLE_NAME,
        Key: {
            [GROUP_PRIMARY_KEY]: groupId
        }
    };

    await db.delete(params).promise();
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

async function getGroupsOfaUser(username: string) {
    console.log("Searching for groups where " + username + " is member or owner")
    var params = {
        TableName: GROUP_TABLE_NAME,
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