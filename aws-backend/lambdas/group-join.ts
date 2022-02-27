import * as AWS from 'aws-sdk';

const GROUP_PRIMARY_KEY = process.env.GROUP_PRIMARY_KEY || '';
const GROUP_TABLE_NAME = process.env.GROUP_TABLE_NAME || '';
const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '';

const db = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any = {}): Promise<any> => {
    try {
        const username = event.requestContext.authorizer.claims["cognito:username"]

        const body = typeof event.body == 'object' ? event.body : JSON.parse(event.body);

        var groupId = body.groupId
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

        //check if person emitting request is member
        console.log("Checking if user is member")
        if (result.groupMember.includes(username)) {
            console.log("user is already groupMember")

            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "you are already member of this group"
            };
        }
        console.log("user not yet groupMember")




        //check if already owner
        console.log("Checking if user is groupOwner")
        if (username === result.groupOwner) {
            console.log("user is groupOwner")

            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "you are the owner of this group"
            };
        }
        console.log("user not groupOwner")



        //check if not blocked
        console.log("Checking if user is blocked")
        if (result.blockedMember.includes(username)) {
            console.log("user is blocked")

            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "you are blocked in this group. rejoining wont work"
            };
        }
        console.log("user is not blocked")

        await joinGroup(username, groupId)
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



async function joinGroup(username: string, groupId: string) {
    console.log("User with name " + username + " joining group with id " + groupId)

    const fieldToBeUpdated = "groupMember"

    const params: any = {
        TableName: GROUP_TABLE_NAME,
        Key: {
            [GROUP_PRIMARY_KEY]: groupId
        },
        ReturnValues: 'ALL_NEW',
        UpdateExpression: 'set #groupMember = list_append(if_not_exists(#groupMember, :empty_list), :newGroupMember)',
        ExpressionAttributeNames: {
            '#groupMember': fieldToBeUpdated
        },
        ExpressionAttributeValues: {
            ':newGroupMember': [username],
            ':empty_list': []
        }
    }
    console.log("update params: " + JSON.stringify(params))
    try {
        const queryResponse = await db.update(params).promise();
        console.log("group join update succeeded. Updated group object: " + JSON.stringify(queryResponse))
        return queryResponse.Attributes;
    } catch (dbError: any) {
        throw dbError;
    }
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