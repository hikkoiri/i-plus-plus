import * as AWS from 'aws-sdk';



const USER_TABLE_NAME = process.env.USER_TABLE_NAME || '';
const USER_PRIMARY_KEY = process.env.USER_PRIMARY_KEY || '';
const GROUP_TABLE_NAME = process.env.GROUP_TABLE_NAME || '';
const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '';
const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`
const DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

const db = new AWS.DynamoDB.DocumentClient();


export const handler = async (event: any = {}): Promise<any> => {
    try {
        
        const username = event.requestContext.authorizer.claims["cognito:username"]
        const user = await getCurrentUserContext(username)

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

async function findOneUserByUsername(username: string) {
    const params = {
        TableName: USER_TABLE_NAME,
        Key: {
            [USER_PRIMARY_KEY]: username
        }
    };

    const response = await db.get(params).promise();
    return response.Item;
}

async function insertNewUser(username: string) {

    const item = { "username": username }
    const params = {
        TableName: USER_TABLE_NAME,
        Item: item
    };

    try {
        await db.put(params).promise();
        return item;
    } catch (dbError: any) {
        const errorResponse = dbError.code === 'ValidationException' && dbError.message.includes('reserved keyword') ?
            DYNAMODB_EXECUTION_ERROR : RESERVED_RESPONSE;
        throw errorResponse;
    }
}

async function updateActiveGroupContextIdForUser(user: any, newGroupContextId: string) {
    console.log("updating activeGroupContext for user " + JSON.stringify(user) + " to newGroupContextId " + newGroupContextId)
    const fieldToBeUpdated = "activeGroupContextId"
    const params: any = {
        TableName: USER_TABLE_NAME,
        Key: {
            [USER_PRIMARY_KEY]: user.username
        },
        UpdateExpression: `set ${fieldToBeUpdated} = :${fieldToBeUpdated}`,
        ExpressionAttributeValues: {},
        ReturnValues: 'ALL_NEW'
    }
    params.ExpressionAttributeValues[`:${fieldToBeUpdated}`] = newGroupContextId;

    try {
        const queryResponse = await db.update(params).promise();
        console.log("activeGroupContextId update succeeded. Updated user object: " + JSON.stringify(queryResponse))
        return queryResponse.Attributes;
    } catch (dbError: any) {
        const errorResponse = dbError.code === 'ValidationException' && dbError.message.includes('reserved keyword') ?
            DYNAMODB_EXECUTION_ERROR : RESERVED_RESPONSE;
        throw errorResponse;
    }
}


async function getCurrentUserContext(username: string) {
    console.log("Trying to find user with username: " + username)
    var foundUser: any = await findOneUserByUsername(username)
    console.log("User DB query result: " + JSON.stringify(foundUser))
    if (!foundUser) {
        console.log("User " + username + " not exist yet in db collection. Creating one.")
        var createdUser = await insertNewUser(username)
        foundUser = createdUser
    }
    else {
        console.log("User " + username + " already existed in db collection.")
    }

    //make sure that user is not blocked in active group
    // if active context is not set yet, skip
    if (foundUser.activeGroupContextId === null || foundUser.activeGroupContextId === "") {
        console.log("activeGroupContextId not set")

        //check if active context matches allowed groups
        var usersGroups: any = await getGroupsOfaUser(foundUser.username)
        console.log("Query results for groups where user is member or owner: " + JSON.stringify(usersGroups))

        if (usersGroups.length > 0) {
            console.log("Found groups is not empty")
            if (usersGroups.filter((group: any) => (group._id == foundUser.activeGroupContextId)).length > 0) {
                console.log("active context matches allowed groups, continue")
            } else {
                console.log("active context does not match allowed groups, finding new one")
                //switch to next available group
                foundUser = await updateActiveGroupContextIdForUser(foundUser, usersGroups[0]._id.toString())
            }
        } else {
            console.log("Found groups is empty")

            //user has an active context which does not match with allowed groups,because its empty
            //setting to empty therefore
            foundUser = await updateActiveGroupContextIdForUser(foundUser, "")
        }
    }

    return foundUser
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

