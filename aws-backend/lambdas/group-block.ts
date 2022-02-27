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

        var targetedUser = body.username
        if (targetedUser === undefined || targetedUser === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "no username provided"
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
        console.log("Checking if user is owner")
        if (result.groupOwner !== username) {
            console.log("user is not groupOwner")
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "only group owners are allowed to perform this action"
            };
        }
        console.log("user is groupOwner")




        //check if already targeted user is owner
        console.log("Checking if targetedUser is groupOwner")
        if (targetedUser === result.groupOwner) {
            console.log("targetedUser is groupOwner")

            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "cannot block owner of the group"
            };
        }
        console.log("targetedUser not groupOwner")



        //check if targetedUser already blocked
        console.log("Checking if targetedUser is already  blocked")
        if (result.blockedMember.includes(targetedUser)) {
            console.log("targetedUser is blocked")

            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "user already blocked in this group"
            };
        }
        console.log("targetedUser is not blocked")

        //check if targetedUser is member
        console.log("Checking if targetedUser is groupMember")
        if (!result.groupMember.includes(targetedUser)) {
            console.log("targetedUser is not groupMember")

            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: "targetedUser is not a member of this group"
            };
        }
        console.log("targetedUser is groupMember")


        console.log(username + " blocks " + targetedUser + " in group " + groupId)
        await blockUser(targetedUser, result)
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



async function blockUser(username: string, group: any) {
    await removeMemberStatus(username, group)
    group = await getGroup(group._id)
    console.log("interim group status: " + group)
    await setBlockedStatus(username, group._id)
}

async function setBlockedStatus(username: string, groupId: any) {
    console.log("User with name " + username + " gets blocked in group with id " + groupId)

    const fieldToBeUpdated = "blockedMember"

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
        console.log("group update succeeded. Updated group object: " + JSON.stringify(queryResponse))
        return queryResponse.Attributes;
    } catch (dbError: any) {
        throw dbError;
    }
}

async function removeMemberStatus(username: string, group: any) {
    console.log("User with name " + username + " loses member status in group with id " + group._id)

    const fieldToBeUpdated = "groupMember"
    //not entirely sure why group[fieldToBeUpdated] doesnt work, but fine
    const indexToRemove = group.groupMember.indexOf(username);
    if (indexToRemove === -1) {
        throw "user not found in group. this exception should NEVER occur, because it is checked before"
    }
    const params: any = {
        TableName: GROUP_TABLE_NAME,
        Key: {
            [GROUP_PRIMARY_KEY]: group._id
        },
        ReturnValues: 'ALL_NEW',
        UpdateExpression: `REMOVE ${fieldToBeUpdated}[${indexToRemove}]`,
    }

    console.log("update params: " + JSON.stringify(params))
    try {
        const queryResponse = await db.update(params).promise();
        console.log("group update succeeded. Updated group object: " + JSON.stringify(queryResponse))
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