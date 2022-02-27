const CORS_ALLOWED_ORIGIN = process.env.CORS_ALLOWED_ORIGIN || '';


export const handler = async (event: any = {}): Promise<any> => {

    const stepConversionList = [
        {
            "id": 0,
            "multiplier": 1,
            "en": {
                "name": "Walking",
                "unit": "Steps"
            },
            "de": {
                "name": "Gehen",
                "unit": "Schritte"
            }
        },
        {
            "id": 1,
            "multiplier": 145,
            "en": {
                "name": "Aerobics, low impact",
                "unit": "Minutes"
            },
            "de": {
                "name": "Aerobic, geringe Belastung",
                "unit": "Minuten"
            }
        },
        {
            "id": 2,
            "multiplier": 246,
            "en": {
                "name": "Step Aerobic",
                "unit": "Minutes"
            },
            "de": {
                "name": "Step Aerobic",
                "unit": "Minuten"
            }
        },
        {
            "id": 3,
            "multiplier": 131,
            "en": {
                "name": "Badminton",
                "unit": "Minutes"
            },
            "de": {
                "name": "Badminton",
                "unit": "Minuten"
            }
        },
        {
            "id": 4,
            "multiplier": 174,
            "en": {
                "name": "Basketball",
                "unit": "Minutes"
            },
            "de": {
                "name": "Basketball",
                "unit": "Minuten"
            }
        },
        {
            "id": 5,
            "multiplier": 116,
            "en": {
                "name": "Bicycling, leisurely",
                "unit": "Minutes"
            },
            "de": {
                "name": "Fahrradfahren, gemütlich",
                "unit": "Minuten"
            }
        },
        {
            "id": 6,
            "multiplier": 203,
            "en": {
                "name": "Bicycling, moderate ",
                "unit": "Minutes"
            },
            "de": {
                "name": "Fahrradfahren, moderat",
                "unit": "Minuten"
            }
        },
        {
            "id": 7,
            "multiplier": 87,
            "en": {
                "name": "Bowling",
                "unit": "Minutes"
            },
            "de": {
                "name": "Bowling",
                "unit": "Minuten"
            }
        },
        {
            "id": 8,
            "multiplier": 87,
            "en": {
                "name": "Canoeing, light",
                "unit": "Minutes"
            },
            "de": {
                "name": "Kanufahren, leicht",
                "unit": "Minuten"
            }
        },
        {
            "id": 9,
            "multiplier": 232,
            "en": {
                "name": "Circuit Training",
                "unit": "Minutes"
            },
            "de": {
                "name": "Zirkel Training",
                "unit": "Minuten"
            }
        },
        {
            "id": 10,
            "multiplier": 232,
            "en": {
                "name": "Cross-country skiing",
                "unit": "Minutes"
            },
            "de": {
                "name": "Skilanglauf",
                "unit": "Minuten"
            }
        },
        {
            "id": 11,
            "multiplier": 131,
            "en": {
                "name": "Dancing",
                "unit": "Minutes"
            },
            "de": {
                "name": "Tanzen",
                "unit": "Minuten"
            }
        },
        {
            "id": 12,
            "multiplier": 174,
            "en": {
                "name": "Downhill skiing",
                "unit": "Minutes"
            },
            "de": {
                "name": "Ski alpin",
                "unit": "Minuten"
            }
        },
        {
            "id": 13,
            "multiplier": 116,
            "en": {
                "name": "Gardening, light",
                "unit": "Minutes"
            },
            "de": {
                "name": "Gartenarbeit, leicht",
                "unit": "Minuten"
            }
        },
        {
            "id": 14,
            "multiplier": 174,
            "en": {
                "name": "Gardening, heavy",
                "unit": "Minutes"
            },
            "de": {
                "name": "Gartenarbeit, schwer",
                "unit": "Minuten"
            }
        },
        {
            "id": 15,
            "multiplier": 131,
            "en": {
                "name": "Golfing, without a cart",
                "unit": "Minutes"
            },
            "de": {
                "name": "Golfen, ohne Kart",
                "unit": "Minuten"
            }
        },
        {
            "id": 16,
            "multiplier": 67,
            "en": {
                "name": "Grocery Shopping",
                "unit": "Minutes"
            },
            "de": {
                "name": "Lebensmitteleinkäufe",
                "unit": "Minuten"
            }
        },
        {
            "id": 17,
            "multiplier": 348,
            "en": {
                "name": "Handball",
                "unit": "Minutes"
            },
            "de": {
                "name": "Handball",
                "unit": "Minuten"
            }
        },
        {
            "id": 18,
            "multiplier": 172,
            "en": {
                "name": "Hiking",
                "unit": "Minutes"
            },
            "de": {
                "name": "Wandern",
                "unit": "Minuten"
            }
        },
        {
            "id": 19,
            "multiplier": 116,
            "en": {
                "name": "Horseback riding",
                "unit": "Minutes"
            },
            "de": {
                "name": "Reiten",
                "unit": "Minuten"
            }
        },
        {
            "id": 20,
            "multiplier": 260,
            "en": {
                "name": "Hockey",
                "unit": "Minutes"
            },
            "de": {
                "name": "Hockey",
                "unit": "Minuten"
            }
        },
        {
            "id": 21,
            "multiplier": 101,
            "en": {
                "name": "Housework",
                "unit": "Minutes"
            },
            "de": {
                "name": "Hausarbeit",
                "unit": "Minuten"
            }
        },
        {
            "id": 22,
            "multiplier": 203,
            "en": {
                "name": "Ice skating",
                "unit": "Minutes"
            },
            "de": {
                "name": "Eislaufen",
                "unit": "Minuten"
            }
        },
        {
            "id": 23,
            "multiplier": 290,
            "en": {
                "name": "Jumping rope",
                "unit": "Minutes"
            },
            "de": {
                "name": "Springseil springen",
                "unit": "Minuten"
            }
        },
        {
            "id": 24,
            "multiplier": 290,
            "en": {
                "name": "Martial Arts",
                "unit": "Minutes"
            },
            "de": {
                "name": "Kampfsport",
                "unit": "Minuten"
            }
        },
        {
            "id": 25,
            "multiplier": 160,
            "en": {
                "name": "Mowing the lawn",
                "unit": "Minutes"
            },
            "de": {
                "name": "Rasen mähen",
                "unit": "Minuten"
            }
        },
        {
            "id": 26,
            "multiplier": 131,
            "en": {
                "name": "Painting walls",
                "unit": "Minutes"
            },
            "de": {
                "name": "Wände malern",
                "unit": "Minuten"
            }
        },
        {
            "id": 27,
            "multiplier": 101,
            "en": {
                "name": "Pilates",
                "unit": "Minutes"
            },
            "de": {
                "name": "Pilates",
                "unit": "Minuten"
            }
        },
        {
            "id": 28,
            "multiplier": 116,
            "en": {
                "name": "Ping pong",
                "unit": "Minutes"
            },
            "de": {
                "name": "Tischtennis",
                "unit": "Minuten"
            }
        },
        {
            "id": 29,
            "multiplier": 125,
            "en": {
                "name": "Raking leaves",
                "unit": "Minutes"
            },
            "de": {
                "name": "Blätter harken",
                "unit": "Minuten"
            }
        },
        {
            "id": 30,
            "multiplier": 203,
            "en": {
                "name": "Rollerblading",
                "unit": "Minutes"
            },
            "de": {
                "name": "Inlineskaten",
                "unit": "Minuten"
            }
        },
        {
            "id": 31,
            "multiplier": 101,
            "en": {
                "name": "Rowing, light",
                "unit": "Minutes"
            },
            "de": {
                "name": "Rudern, leicht",
                "unit": "Minuten"
            }
        },
        {
            "id": 32,
            "multiplier": 203,
            "en": {
                "name": "Rowing, moderate",
                "unit": "Minutes"
            },
            "de": {
                "name": "Rudern, moderat",
                "unit": "Minuten"
            }
        },
        {
            "id": 33,
            "multiplier": 463,
            "en": {
                "name": "Running, 16 km/h (3.7 min/km)",
                "unit": "Minutes"
            },
            "de": {
                "name": "Rennen, 16 km/h (3.7 min/km)",
                "unit": "Minuten"
            }
        },
        {
            "id": 34,
            "multiplier": 391,
            "en": {
                "name": "Running, 12.8 km/h (4.7 min/km)",
                "unit": "Minutes"
            },
            "de": {
                "name": "Rennen, 12.8 km/h (4.7 min/km)",
                "unit": "Minuten"
            }
        },
        {
            "id": 35,
            "multiplier": 290,
            "en": {
                "name": "Running, 9.7 km/h (6.2 min/km)",
                "unit": "Minutes"
            },
            "de": {
                "name": "Rennen, 9.7 km/h (6.2 min/km)",
                "unit": "Minuten"
            }
        },
        {
            "id": 36,
            "multiplier": 232,
            "en": {
                "name": "Running, 8 km/h (7.5 min/km)",
                "unit": "Minutes"
            },
            "de": {
                "name": "Rennen, 8 km/h (7.5 min/km)",
                "unit": "Minuten"
            }
        },
        {
            "id": 37,
            "multiplier": 174,
            "en": {
                "name": "Snow shoveling",
                "unit": "Minutes"
            },
            "de": {
                "name": "Schnee schaufeln",
                "unit": "Minuten"
            }
        },
        {
            "id": 38,
            "multiplier": 182,
            "en": {
                "name": "Snowboarding",
                "unit": "Minutes"
            },
            "de": {
                "name": "Snowboarden",
                "unit": "Minuten"
            }
        },
        {
            "id": 39,
            "multiplier": 203,
            "en": {
                "name": "Soccer",
                "unit": "Minutes"
            },
            "de": {
                "name": "Fussball",
                "unit": "Minuten"
            }
        },
        {
            "id": 40,
            "multiplier": 72,
            "en": {
                "name": "Stretching",
                "unit": "Minutes"
            },
            "de": {
                "name": "Dehnen",
                "unit": "Minuten"
            }
        },
        {
            "id": 41,
            "multiplier": 203,
            "en": {
                "name": "Swimming",
                "unit": "Minutes"
            },
            "de": {
                "name": "Schwimmen",
                "unit": "Minuten"
            }
        },
        {
            "id": 42,
            "multiplier": 232,
            "en": {
                "name": "Tennis",
                "unit": "Minutes"
            },
            "de": {
                "name": "Tennis",
                "unit": "Minuten"
            }
        },
        {
            "id": 43,
            "multiplier": 101,
            "en": {
                "name": "Trampoline",
                "unit": "Minutes"
            },
            "de": {
                "name": "Trampolin springen",
                "unit": "Minuten"
            }
        },
        {
            "id": 44,
            "multiplier": 87,
            "en": {
                "name": "Volleyball",
                "unit": "Minutes"
            },
            "de": {
                "name": "Volleyball",
                "unit": "Minuten"
            }
        },
        {
            "id": 45,
            "multiplier": 87,
            "en": {
                "name": "Wash the car",
                "unit": "Minutes"
            },
            "de": {
                "name": "Auto schrubben",
                "unit": "Minuten"
            }
        },
        {
            "id": 46,
            "multiplier": 116,
            "en": {
                "name": "Water aerobics",
                "unit": "Minutes"
            },
            "de": {
                "name": "Wasseraerobic",
                "unit": "Minuten"
            }
        },
        {
            "id": 47,
            "multiplier": 87,
            "en": {
                "name": "Weight lifting, moderate",
                "unit": "Minutes"
            },
            "de": {
                "name": "Gewichte heben, moderat",
                "unit": "Minuten"
            }
        },
        {
            "id": 48,
            "multiplier": 174,
            "en": {
                "name": "Weight lifting, vigorous",
                "unit": "Minutes"
            },
            "de": {
                "name": "Gewichte heben, energisch",
                "unit": "Minuten"
            }
        },
        {
            "id": 49,
            "multiplier": 72,
            "en": {
                "name": "Yoga",
                "unit": "Minutes"
            },
            "de": {
                "name": "Yoga",
                "unit": "Minuten"
            }
        }
    ]

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGIN
        },
        body: JSON.stringify(stepConversionList)
    };
};
