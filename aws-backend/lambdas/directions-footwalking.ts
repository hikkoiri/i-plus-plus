import fetch from 'node-fetch';


const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '';
const OPENROUTE_SERVICE_API_URL = process.env.OPENROUTE_SERVICE_API_URL || '';
const OPENROUTE_SERVICE_API_KEY = process.env.OPENROUTE_SERVICE_API_KEY || '';


export const handler = async (event: any = {}): Promise<any> => {
    try {

        const body = typeof event.body == 'object' ? event.body : JSON.parse(event.body);

        var startLat = body.start.lat
        if (startLat === undefined || startLat === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no start latitude provided`
            };
        }
        var startLng = body.start.lng
        if (startLng === undefined || startLng === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no start longitude provided`
            };
        }

        var finishLat = body.end.lat
        if (finishLat === undefined || finishLat === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no finish latitude provided`
            };
        }
        var finishLng = body.end.lng
        if (finishLng === undefined || finishLng === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no finish longitude provided`
            };
        }


        var api_res = await fetch(OPENROUTE_SERVICE_API_URL +
            "/v2/directions/foot-walking?" +
            "api_key=" + OPENROUTE_SERVICE_API_KEY + "&" +
            "start=" + startLng + "," + startLat + "&" +
            "end=" + finishLng + "," + finishLat)

        var json: any = await api_res.json()

        var concluded: any = {}
        concluded.meter = json.features[0].properties.summary.distance
        concluded.steps = Math.ceil(concluded.meter * 1.5)
        var bbox = json.bbox
        concluded.bbox = [
            [bbox[1], bbox[0]],
            [bbox[3], bbox[2]]
        ]

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
            },
            body: JSON.stringify(concluded)
        };
    } catch (error) {
        console.log("Captured error: " + JSON.stringify(error))
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
            },
            body: JSON.stringify("route cannot be calculated")
        };
    }
};