const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();
const app = express();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ieei5.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    console.log("here i am")
    res.send("server working");

  });

  async function run() {
    try {
      await client.connect();
      console.log("DB Connected correctly to server");
    
      const issueCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL1);
      const lastRequestTimeCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL2);

       app.post("/support/create_ticket",async(req, res) => {

        const { userID, date} = req.body;

        const queryResult = lastRequestTimeCollection.find({userID:userID});
        const documents = new Array();
        for await (const doc of queryResult) {
            documents.push(doc);
        }

        if(documents.length){

            const previousRequestTime = new Date(documents[0].lastRequestTime).getTime();;
            const currentRequestTime = new Date(date).getTime();
            const elapsedTime = (currentRequestTime - previousRequestTime)/(1000 * 60);

            if( elapsedTime > 30) {  
                const result = await issueCollection.insertOne(req.body);
                const updateResult = await lastRequestTimeCollection.updateOne({ userID: userID },{$set: { lastRequestTime: date}})

                if(result.acknowledged && updateResult.matchedCount){
                    const insertedId = result.insertedId.valueOf();
                    res.status(200).json({"data":{"_id":`${insertedId}`}});
                }else{
                    res.status(500).json({"message":"Ticket insertion failed! Please try again after some time."});
                }
            }else{
                res.status(409).json({"message":"You have already placed a support ticket. Please wait at least one hour before sending another request"});
            }
        }else{
            const lastRequestTimeResult = await lastRequestTimeCollection.insertOne({userID: userID,lastRequestTime:date});
            const issueResult = await issueCollection.insertOne(req.body);

            if(lastRequestTimeResult.acknowledged && issueResult.acknowledged){
                const insertedId = issueResult.insertedId.valueOf();
                res.status(200).json({"data":{"_id":`${insertedId}`}});
            }else{
                res.status(409).json({"message":"Ticket insertion failed! Please try again after some time."});
            }
        }
    });

    } finally {
      // Ensures that the client will close when you finish/error
      //await client.close();

    }
  }
  run().catch(console.dir);

  app.listen(process.env.PORT || 8085,()=>{
    console.log(`server listening ${process.env.PORT}`)
  });