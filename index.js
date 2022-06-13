const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.c0cq6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});


//!-------- Verify JWT Token ---------
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const behaviorCollection = client.db("Eubrics").collection("behaviors");
    const itemCollection = client.db("Eubrics").collection("items");

    app.get("/behaviors", async (req, res) => {
      const result = await behaviorCollection.find({}).toArray();
      res.send(result);
    });

    app.get("/behaviors/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await behaviorCollection.findOne(query);
      res.send(result);
    });

    app.post("/items", async (req, res) => {
      const newItem = req.body;
      const result = await itemCollection.insertOne(newItem);
      res.send(result);
    });

    app.get("/my-items/:data", verifyJWT,async (req, res) => {
      const data = req.params.data;
      const [email, behaviorName] = data.split("_");
      const query = { userEmail: email, behaviorName: behaviorName };
      const result = await itemCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/my-items/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await itemCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/myItems/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: ObjectId(id) };
      const {updatedName} = req.body;
      console.log(updatedName);
      const updatedDoc = {
        $set:{
          itemName: updatedName
        }
      }
      const result = await itemCollection.updateOne(filter, updatedDoc);
      res.send(result)
    });


     app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const token = jwt.sign({ email: email }, process.env.TOKEN_SECRET, {
        expiresIn: "2hr",
      });
      res.send({ token });
    });


  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server");
});

app.listen(port, () => {
  console.log("listening from port: ", port);
});
