const MongoClient = require('mongodb').MongoClient;
const faker = require('faker');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '../.env' });

const MONGO_URL = process.env.MONGO_URL;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;
//const EXPIRE_AFTER = 31536000 // 1 година

var client = new MongoClient(MONGO_URL);
var db;
var collection;
var locations = [];

async function createCollection(db) {
    var collectionCheck = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (collectionCheck.length == 0) {
        await db.createCollection(
            COLLECTION_NAME,
            {
                timeseries: {
                    timeField: 'date',
                    metaField: 'typeOfSensor',
                    granularity: 'hours'
                }
                //expireAfterSeconds: EXPIRE_AFTER
            }
        );
        console.log(`Collection ${COLLECTION_NAME} created.`);
    } else console.log(`Collection ${COLLECTION_NAME} already exists.                                                   Skipping creation.`);
}

function generateMeasurement(typeOfSensor, currentDate) {
    var min, max;
    var hour = currentDate.getHours();
    var month = currentDate.getMonth();

    switch (typeOfSensor) {
        case 'temperature':
            if (month >= 5 && month <= 7) {
                min = 24;
                max = 36;
            } else if (month == 4) {
                min = 17;
                max = 28;
            }
            else if (month == 3 || month == 8) {
                min = 12;
                max = 20;
            } else if (month == 2 || month == 9) {
                min = 5;
                max = 16;
            } else {
                min = -15;
                max = 6;
            }
            if (hour >= 8 && hour < 21) {
                min += 5;
                max += 5;
            } else {
                min -= 5;
                max -= 5;
            }
            unit = '°C';
            break;

        case 'humidity':
            if (month >= 5 && month <= 7) {
                min = 30;
                max = 80;
            } else {
                min = 20;
                max = 70;
            }
            unit = '%';
            break;

        case 'lightIntensity':
            if (month >= 3 && month <= 8) {
                if (hour >= 6 && hour < 21) {
                    min = 500;
                    max = 1000;
                } else {
                    min = 100;
                    max = 300;
                }
            } else {
                if (hour >= 7 && hour < 19) {
                    min = 400;
                    max = 800;
                } else {
                    min = 100;
                    max = 300;
                }
            }
            unit = 'lx';
            break;

        case 'pressure':
            min = 950;
            max = 1050;
            unit = 'hPa';
            break;

        case 'airQuality':
            min = 0;
            max = 500;
            unit = 'AQI';
            break;

        case 'noise':
            if (hour >= 6 && hour < 20) {
                min = 40;
                max = 70;
            } else {
                min = 30;
                max = 60;
            }
            unit = 'dB';
            break;
    }
    return {
        value: faker.datatype.number({ min, max, precision: 0.1 }),
        unit
    };
}

function generateLocations(count) {
    for (var i = 0; i < count; i++) {
        var latitude = faker.datatype.number({
            min: 42.1061,
            max: 43.6141,
            precision: 0.0001
        });
        var longitude = faker.datatype.number({
            min: 23.0412,
            max: 27.4981,
            precision: 0.0001
        });

        var location = {
            latitude,
            longitude,
            sensors: {}
        };

        locations.push(location);
    }
    return locations;
}

async function generateDataAndInsert() {
    var startDate = new Date('2022-01-01');
    var endDate = new Date('2023-01-01');

    var currentDate = new Date(startDate);
    var sensorTypes = [
        'temperature',
        'humidity',
        'lightIntensity',
        'pressure',
        'noise',
        'airQuality'
    ];

    while (currentDate < endDate) {
        console.time(`Time needed to generate ${locations.length * 6}  documents`);
        var measurements = [];

        locations.forEach(location => {
            sensorTypes.forEach(sensorType => {
                var sensorId = location.sensors[sensorType] || uuidv4();
                location.sensors[sensorType] = sensorId;

                var measurementData = generateMeasurement(sensorType, currentDate);
                var measurement = {
                    sensorId,
                    date: currentDate,
                    typeOfSensor: sensorType,
                    value: measurementData.value,
                    unit: measurementData.unit,
                    position: {
                        longitude: location.longitude,
                        latitude: location.latitude
                    }
                };
                measurements.push(measurement);
            });
        });

        try {
            await collection.insertMany(measurements);
            console.log(`Measurements for ${currentDate} inserted  successfully.`);
        } catch (error) {
            console.error(`Failed to insert measurements for ${currentDate}:`, error);
        }

        currentDate.setHours(currentDate.getHours() + 1);

        await sleep(500);
        console.timeEnd(`Time needed to generate ${locations.length * 6}  documents`);
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    try {
        await client.connect();
        console.log('Connected to MongoDB successfully.');
        db = client.db(DATABASE_NAME);
        await createCollection(db);
        collection = db.collection(COLLECTION_NAME);
    } catch (error) {
        console.error('An error occurred:', error);
    }
    locations = await generateLocations(200);

    generateDataAndInsert();
})();
