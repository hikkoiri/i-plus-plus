import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

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
        var name = body.name
        if (name === undefined || name === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no name provided`
            };
        }
        var creationDate = body.creationDate
        if (creationDate === undefined || creationDate === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no creationDate provided`
            };
        }
        var start = body.start
        if (start === undefined || start === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no start provided`
            };
        }
        var startLocation = body.start.location
        if (startLocation === undefined || startLocation === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no start.location provided`
            };
        }
        var startLat = body.start.lat
        if (startLat === undefined || startLat === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no start.lat provided`
            };
        }
        var startLng = body.start.lng
        if (startLng === undefined || startLng === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no start.lng provided`
            };
        }
        var finish = body.finish
        if (finish === undefined || finish === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no finish provided`
            };
        }
        var finishLocation = body.finish.location
        if (finishLocation === undefined || finishLocation === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no finish.location provided`
            };
        }
        var finishLat = body.finish.lat
        if (finishLat === undefined || finishLat === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no finish.lat provided`
            };
        }
        var finishLng = body.finish.lng
        if (finishLng === undefined || finishLng === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no finish.lng provided`
            };
        }
        var distance = body.distance
        if (distance === undefined || distance === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no distance provided`
            };
        }
        var distanceMeters = body.distance.meter
        if (distanceMeters === undefined || distanceMeters === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no distance.meter provided`
            };
        }
        var distanceSteps = body.distance.steps
        if (distanceSteps === undefined || distanceSteps === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no distance.steps provided`
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

        // check if there is no other active challenge
        var foundChallenges: any = await getActiveChallengesOfGroup(groupId)
        if (foundChallenges.length > 0) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: JSON.stringify("there is already an active challenge")
            };
        }

        await saveChallenge(body)


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


async function saveChallenge(inputs: any) {
    console.log("Creating new challenge with name: " + inputs.name)
    const newChallenge: any = {
        ...inputs,
        archived: false,
        activeStepCount: 0,
        [CHALLENGE_PRIMARY_KEY]: uuidv4()
    }

    const params = {
        TableName: CHALLENGE_TABLE_NAME,
        Item: newChallenge,
        ReturnValues: "ALL_OLD"
    };

    try {
        await db.put(params).promise();
        console.log("Created new challenge: " + JSON.stringify(newChallenge))
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



async function getActiveChallengesOfGroup(groupId: string) {
    const challenges: any = await getChallengesOfGroup(groupId)
    return challenges.filter((challenge: any) => challenge.archived === false)
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
