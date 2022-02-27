import fetch from 'node-fetch';


const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '';
const OPENROUTE_SERVICE_API_URL = process.env.OPENROUTE_SERVICE_API_URL || '';
const OPENROUTE_SERVICE_API_KEY = process.env.OPENROUTE_SERVICE_API_KEY || '';


export const handler = async (event: any = {}): Promise<any> => {
    try {

        const body = typeof event.body == 'object' ? event.body : JSON.parse(event.body);

        var text = body.text

        if (text === undefined || text === "") {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
                },
                body: `no location text provided`
            };
        }

        var api_res = await fetch(OPENROUTE_SERVICE_API_URL +
            "/geocode/search?" +
            "api_key=" + OPENROUTE_SERVICE_API_KEY + "&" +
            "text=" + text)

        //console.log(JSON.stringify(api_res))


        var json: any = await api_res.json()
        //console.log(JSON.stringify(json))

        var concluded: any = {}
        concluded.lat = json.features[0].geometry.coordinates[1]
        concluded.lng = json.features[0].geometry.coordinates[0]

        //console.log(JSON.stringify(concluded))


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
            body: JSON.stringify("unknown location")
        };
    }
};