const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../.env' });

const MONGO_URL = process.env.MONGO_URL;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;

async function countSensorMeasurements() {
  var client = new MongoClient(MONGO_URL);

  try {
    await client.connect();
    var db = client.db(DATABASE_NAME);
    var collection = db.collection(COLLECTION_NAME);

    var sensorTypes = [
      'temperature',
      'humidity',
      'lightIntensity',
      'pressure',
      'noise',
      'airQuality'
    ];

    console.time('Time needed to count each type of measurements');

    for (var sensorType of sensorTypes) {
      var count = await collection.countDocuments({ typeOfSensor: sensorType });
      console.log(`Number of ${sensorType} measurements: ${count}`);
    }

    console.timeEnd('Time needed to count each type of measurements');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    client.close();
  }
}

countSensorMeasurements();