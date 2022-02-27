import * as AWS from 'aws-sdk';



const USER_TABLE_NAME = process.env.USER_TABLE_NAME || '';
const USER_PRIMARY_KEY = process.env.USER_PRIMARY_KEY || '';
const GROUP_PRIMARY_KEY = process.env.GROUP_PRIMARY_KEY || '';
const GROUP_TABLE_NAME = process.env.GROUP_TABLE_NAME || ''; const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '';

const db = new AWS.DynamoDB.DocumentClient();


export const handler = async (event: any = {}): Promise<any> => {
    try {

        const username = event.requestContext.authorizer.claims["cognito:username"]

        const body = typeof event.body == 'object' ? event.body : JSON.parse(event.body);

        const groupId = body.groupId
        if (groupId === undefined || groupId === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "no groupId provided"
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
        //check if member or owner
        console.log("checking if user is owner or member of group")
        console.log("result.groupMember.includes(username) ", result.groupMember.includes(username))
        console.log("username === result.groupOwner ", username === result.groupOwner)
        console.log("username: "+ username)
        console.log("result.groupMember: "+ result.groupMember)
        console.log("result.groupOwner: "+ result.groupOwner)
        console.log(" !(result.groupMember.includes(username)) && !(username === result.groupOwner)", !(result.groupMember.includes(username)) || !(username === result.groupOwner))
        if (!(result.groupMember.includes(username)) && !(username === result.groupOwner)) {
            console.log("not member or owner")
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "action disallowed. neither owner or member of group"
            };
        }
        console.log("user member or owner")


        //checked if not blocked
        console.log("checking if user is blocked")
        if (username in result.blockedMember) {
            console.log("user is blocked")
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "you are blocked in this group. cannot switch context it"
            };
        }
        console.log("user is not blocked")

        const user = await updateActiveGroupContextIdForUser(username, groupId)

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
            },
            body: JSON.stringify(user)
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

async function updateActiveGroupContextIdForUser(username: any, newGroupContextId: string) {
    console.log("updating activeGroupContext for user with username " + JSON.stringify(username) + " to newGroupContextId " + newGroupContextId)
    const fieldToBeUpdated = "activeGroupContextId"


    const params: any = {
        TableName: USER_TABLE_NAME,
        Key: {
            [USER_PRIMARY_KEY]: username
        },
        UpdateExpression: `set ${fieldToBeUpdated} = :${fieldToBeUpdated}`,
        ExpressionAttributeValues: {},
        ReturnValues: 'ALL_NEW'
    }
    params.ExpressionAttributeValues[`:${fieldToBeUpdated}`] = newGroupContextId;

    console.log("update params: " + JSON.stringify(params))

    try {
        const queryResponse = await db.update(params).promise();
        console.log("activeGroupContextId update succeeded. Updated user object: " + JSON.stringify(queryResponse))
        return queryResponse.Attributes;
    } catch (dbError: any) {
        throw dbError;
    }
}