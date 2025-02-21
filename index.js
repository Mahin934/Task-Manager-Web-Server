const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://mahin-task-nest.surge.sh/',
    'https://task-manager-web-client.vercel.app/',
  ],
  credentials: true
}));
app.use(express.json());




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6qskn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const usersCollection = client.db('taskNestDB').collection('users')
    const taskCollection = client.db('taskNestDB').collection('tasks')


    app.post('/users', async (req, res) => {
      const { email, name } = req.body;

      if (!email || !name) {
        return res.status(400).send('Email and name are required');
      }

      try {
        const usersCollection = client.db('taskNestDB').collection('users');
        const existingUser = await usersCollection.findOne({ email });

        if (existingUser) {
          return res.status(400).send('User already exists');
        }

        const newUser = { email, name };
        await usersCollection.insertOne(newUser);
        res.status(201).send('User registered successfully');
      } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Internal server error');
      }
    });


    // Add Task Route
    app.post("/tasks", async (req, res) => {
      const newTask = req.body;
      const result = await taskCollection.insertOne(newTask);
      res.send(result);
  });
  

    app.get("/tasks", async (req, res) => {
      try {
        const tasks = await taskCollection.find().toArray();
        res.json(tasks); // Send all tasks as a response
      } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).send('Error fetching tasks');
      }
    });

    // Update a task
    app.put("/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = req.body;
        const result = await taskCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        res.send(result);
      } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send('Error updating task');
      }
    });

    // Delete a task
    app.delete("/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await taskCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).send('Error deleting task');
      }
    });








    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', async (req, res) => {
  res.send('TaskNest CURD is running')
})


app.listen(port, () => {
  console.log(`TaskNest Server is running on Port: ${port}`)
})