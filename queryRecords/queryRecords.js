const MongoClient = require('mongodb').MongoClient;
require('dotenv').config({ path: '../.env' });

const MONGO_URL = process.env.MONGO_URL;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;

var client = new MongoClient(MONGO_URL);

async function queryRecords(startTime, endTime) {
    try {
        await client.connect();

        var db = client.db(DATABASE_NAME);
        var collection = db.collection(COLLECTION_NAME);

        var query = {
            date: {
                $gte: startTime,
                $lte: endTime
            }
        };

        console.time(`Time needed to query the documents between ${startTime.toLocaleString('en-US')} and ${endTime.toLocaleString('en-US')}`);

        const count = await collection.countDocuments(query);
        console.log('Number of records:', count.toString());

        console.timeEnd(`Time needed to query the documents between ${startTime.toLocaleString('en-US')} and ${endTime.toLocaleString('en-US')}`);
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        client.close();
    }
}


var startTime = new Date('2022-01-01T00:00:00');
var endTime = new Date('2022-02-01T00:00:00');

setInterval(() => {
    queryRecords(startTime, endTime);
  }, 2000);