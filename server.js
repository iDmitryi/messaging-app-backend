import express from "express";
import mongoose from "mongoose";
import Cors from "cors";
import Messages from "./dbMessages.js";
import Pusher from "pusher";

// App Config
const app = express();
const port = process.env.PORT || 9000;
const connection_url =
  "mongodb+srv://iDmitryi:Mymongodbpassword12_@cluster0.kge6toe.mongodb.net/?retryWrites=true&w=majority";
const pusher = new Pusher({
  appId: "1530188",
  key: "054ec645607ea9264490",
  secret: "531ad0e8465f10885255",
  cluster: "eu",
  useTLS: true,
});

// Middleware
app.use(express.json());
app.use(Cors());

// DB Config
mongoose.set("strictQuery", false);
mongoose.connect(connection_url);

// API Endpoints
const db = mongoose.connection;

db.once("open", () => {
  console.log("DB Connected");

  const msgCollection = db.collection("messagingmessages");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    // console.log(change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;

      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error trigering Pusher");
    }
  });
});

app.get("/", (req, res) => res.status(200).send("Helo TheWebDev"));

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) res.status(500).send(err);
    else res.status(201).send(data);
  });
});

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) res.status(500).send(err);
    else res.status(200).send(data);
  });
});

// Listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`));
