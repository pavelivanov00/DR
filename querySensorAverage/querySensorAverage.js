const MongoClient = require('mongodb').MongoClient;
require('dotenv').config({ path: '../.env' });

const MONGO_URL = process.env.MONGO_URL;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;

var client = new MongoClient(MONGO_URL);

async function querySensorAverage(sensorId, startTime, endTime) {
  try {
    await client.connect();

    var db = client.db(DATABASE_NAME);
    var collection = db.collection(COLLECTION_NAME);

    var query = {
      sensorId,
      date: {
        $gte: startTime,
        $lte: endTime
      }
    };

    var pipeline = [
      {
        $match: query
      },
      {
        $group: {
          _id: "$sensorId",
          averageMeasurement: { $avg: "$value" },
          count: { $sum: 1 },
          typeOfSensor: { $first: "$typeOfSensor" }
        }
      }
    ];

    console.time(`Time needed to query average measurements for Sensor ${sensorId} between \n${startTime.toLocaleString('en-US')} and ${endTime.toLocaleString('en-US')}`);

    var result = await collection.aggregate(pipeline).toArray();

    console.log("Sensor ID: ", sensorId);
    console.log('Average measurement:', result[0] && result[0].averageMeasurement ? result[0].averageMeasurement.toFixed(2) : 'N/A');
    console.log('Type of sensor:', result[0] && result[0].typeOfSensor ? result[0].typeOfSensor : 'N/A');
    console.log('Number of sensor measurements:', result[0] && result[0].count ? result[0].count.toString() : 'N/A');

    console.timeEnd(`Time needed to query average measurements for Sensor ${sensorId} between \n${startTime.toLocaleString('en-US')} and ${endTime.toLocaleString('en-US')}`);
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    client.close();
  }
}

var sensorId = 'a452149f-6f58-4150-ae6f-e3a161df2caa';
var startTime = new Date('2022-01-01T00:00:00');
var endTime = new Date('2022-01-02T00:00:00');

querySensorAverage(sensorId, startTime, endTime);