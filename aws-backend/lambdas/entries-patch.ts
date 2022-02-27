
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const GROUP_PRIMARY_KEY = process.env.GROUP_PRIMARY_KEY || '';
const GROUP_TABLE_NAME = process.env.GROUP_TABLE_NAME || '';
const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '';
const CHALLENGE_TABLE_NAME = process.env.CHALLENGE_TABLE_NAME || '';
const CHALLENGE_PRIMARY_KEY = process.env.CHALLENGE_PRIMARY_KEY || '';

const ENTRIES_TABLE_NAME = process.env.ENTRIES_TABLE_NAME || '';
const ENTRIES_PRIMARY_KEY = process.env.ENTRIES_PRIMARY_KEY || '';


const db = new AWS.DynamoDB.DocumentClient();


export const handler = async (event: any = {}): Promise<any> => {
    try {

        const username = event.requestContext.authorizer.claims["cognito:username"]
        const body = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
        console.log(JSON.stringify(body))


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

        var targetDay = body.targetDay
        if (targetDay === undefined || targetDay === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no targetDay provided`
            };
        }

        var activitySummary = body.activitySummary
        if (activitySummary === undefined || activitySummary === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no activitySummary provided`
            };
        }

        if (activitySummary.totalSteps >= 50000) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `too many steps. are you sure?`
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

        //check if date is correct

        //console.log("isDate(): " + isDate(targetDay))
        //console.log("isDateBeforeTheSecondOne(result.creationDate, targetDay): " + isDateBeforeTheSecondOne(result.creationDate, targetDay))
        //console.log("isDateBeforeTheSecondOne(targetDay, new Date().toLocaleDateString('de-DE'): " + isDateBeforeTheSecondOne(targetDay, new Date().toLocaleDateString('de-DE')))

        if (!isDate(targetDay) || !isDateBeforeOrEqualTheSecondOne(result.creationDate, targetDay) || !isDateBeforeOrEqualTheSecondOne(targetDay, new Date().toLocaleDateString('de-DE'))) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: JSON.stringify("invalid targetDay")
            };
        }

        // check if challenge already archived
        if (result.archived === true) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: JSON.stringify("challenge already archived")
            };
        }

        await saveEntry(body, username)

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
            },
            body: JSON.stringify(await getEntries(groupId, challengeId, username))
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

async function saveEntry(inputs: any, username: string) {

    //prep object
    var entry = {
        [ENTRIES_PRIMARY_KEY]: uuidv4(),
        username: username,
        ...inputs
    }

    await deleteEntryIfPossible(entry)
    await addEntry(entry)
    await recalculateChallengeProgress(entry.groupId, entry.challengeId, username)
}

async function deleteEntryIfPossible(entry: any) {
    console.log("Checking if prior entry exist")
    var priorEntry: any = await getEntry(entry)
    console.log("Found priorEntry:" + priorEntry)
    if (priorEntry === undefined) {
        console.log("no prior entry")
    } else {
        console.log("prior entry found. deleting it")
        await deleteEntryById(priorEntry[ENTRIES_PRIMARY_KEY])
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

async function getEntry(entry: any) {
    //ignore entry _id
    var params = {
        TableName: ENTRIES_TABLE_NAME,
        ExpressionAttributeValues: {
            ':groupId': entry.groupId,
            ':challengeId': entry.challengeId,
            ':targetDay': entry.targetDay,
            ':username': entry.username
        },
        FilterExpression: `groupId = :groupId AND challengeId = :challengeId AND targetDay = :targetDay AND username = :username`
    };
    const queryResponse: any = await db.scan(params).promise();
    var priorEntry = queryResponse.Items[0]
    return priorEntry;
}

async function deleteEntryById(entryId: string) {
    const params = {
        TableName: ENTRIES_TABLE_NAME,
        Key: {
            [ENTRIES_PRIMARY_KEY]: entryId
        }
    };

    await db.delete(params).promise();
    console.log("deleted entry with id: " + entryId)
}

async function addEntry(entry: any) {
    const params = {
        TableName: ENTRIES_TABLE_NAME,
        Item: entry
    };
    await db.put(params).promise();
    console.log("added new entry with id: " + entry[ENTRIES_PRIMARY_KEY])
}

async function recalculateChallengeProgress(groupId: string, challengeId: string, username: string) {
    var entries: any = await getEntries(groupId, challengeId, username)
    var stepCount = 0;
    entries.forEach((entry: any) => {
        stepCount += entry.activitySummary.totalSteps
    });
    await updateTotalStepCount(challengeId, stepCount)
}


async function updateTotalStepCount(challengeId: string, stepCount: number) {

    const params: any = {
        TableName: CHALLENGE_TABLE_NAME,
        Key: {
            [CHALLENGE_PRIMARY_KEY]: challengeId
        },
        ReturnValues: 'ALL_NEW',
        UpdateExpression: 'set activeStepCount = :stepCount',
        ExpressionAttributeValues: {
            ':stepCount': [stepCount],
        }
    }
    const queryResponse = await db.update(params).promise();
    return queryResponse.Attributes;
}

function isDate(input: string) {
    return (/[0-9]{1,2}.[0-9]{1,2}.[0-9]{4}/.test(input))
}

function isDateBeforeOrEqualTheSecondOne(prior: string, after: string) {

    if (!isDate(prior) || !isDate(after)) {
        return false
    }

    var dateParser = /(\d{1,2})\.(\d{1,2})\.(\d{4})/;

    var priorMatch: any = prior.match(dateParser);
    var priorDate = new Date(
        priorMatch[3],
        priorMatch[2] - 1,
        priorMatch[1]
    );

    var afterMatch: any = after.match(dateParser);
    var afterDate = new Date(
        afterMatch[3],
        afterMatch[2] - 1,
        afterMatch[1]
    );

    //console.log("priorDate: " + priorDate)
    //console.log("afterDate: " + afterDate)
    return (priorDate <= afterDate)
}