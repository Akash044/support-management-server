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
    
      const issueCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL1); // collection for all issues
      const lastRequestTimeCollection = client.db(process.env.DB_NAME).collection(process.env.DB_COL2); //collection for each user last request time

       app.post("/support/create_ticket",async(req, res) => {

        const { userID, date} = req.body; //destructuring request body

        const queryResult = lastRequestTimeCollection.find({userID:userID}); //finding record of requesting user using userId
        const documents = queryResult.toArray(); //convert the findings into array

        if(documents.length){ //current user has previous request

            const previousRequestTime = new Date(documents[0].lastRequestTime).getTime(); // finding current user previous request time
            const currentRequestTime = new Date(date).getTime(); // current user current request time
            const elapsedTime = (currentRequestTime - previousRequestTime)/(1000 * 60); // finding difference in minute of request times

            if( elapsedTime > 30) {  // difference between the two requests took more than 30 minutes
                const result = await issueCollection.insertOne(req.body); //insert current request information
                const updateResult = await lastRequestTimeCollection.updateOne({ userID: userID },{$set: { lastRequestTime: date}}) // update the last request time of the current user

                if(result.acknowledged && updateResult.matchedCount){ //if insert and update has been successfully done,then send the inserted id 
                    const insertedId = result.insertedId.valueOf();
                    res.status(200).json({"data":{"_id":`${insertedId}`}});
                }else{
                    res.status(500).json({"message":"Ticket insertion failed! Please try again after some time."});
                }
            }else{ // difference between the two requests took less than or equal 30 minutes
                res.status(409).json({"message":"You have already placed a support ticket. Please wait at least one hour before sending another request"});
            }
        }else{ //current user does not has previous request, insert both request information and last request time of the current user
            const lastRequestTimeResult = await lastRequestTimeCollection.insertOne({userID: userID,lastRequestTime:date});
            const issueResult = await issueCollection.insertOne(req.body);

            if(lastRequestTimeResult.acknowledged && issueResult.acknowledged){//if insert and update has been successfully done,then send the inserted id 
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