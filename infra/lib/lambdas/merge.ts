import { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
const COUNTER_TABLE_NAME = process.env.COUNTER_TABLE_NAME;

const db = new DynamoDBClient();

export const handler = async (event: any = {}): Promise<void> => {

    const scanParams = {
        TableName: COUNTER_TABLE_NAME,
    };

    try {
        const scanCommand = new ScanCommand(scanParams);
        const result = await db.send(scanCommand);

        if (result.Items) {
            for (const item of result.Items) {

                const updatedItem = {
                    ...item,
                    allTimeCount: {
                        N: (parseInt(item.allTimeCount.N!) + parseInt(item.dailyCount.N!)).toString(),
                    },
                    dailyCount: {
                        N: "0",
                    },
                };

                const putParams = {
                    TableName: COUNTER_TABLE_NAME,
                    Item: updatedItem,
                };

                try {
                    const putCommand = new PutItemCommand(putParams);
                    await db.send(putCommand);
                    console.log(`Updated item with origin: ${item.origin.S}`);
                } catch (error) {
                    console.error(`Error updating item with origin: ${item.origin.S}`, error);
                }
            }
        }
    } catch (error) {
        console.error('Error scanning table:', error);
    }
};

