const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// 🛠 Improved CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mahin-task-nest.surge.sh",
      "https://task-manager-web-client.vercel.app",
    ],
    credentials: true, // Allow credentials (cookies, authorization headers)
  })
);

app.use(express.json());

// ✅ Ensure MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6qskn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // ✅ Connect to MongoDB before handling requests
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    const usersCollection = client.db("taskNestDB").collection("users");
    const taskCollection = client.db("taskNestDB").collection("tasks");

    // 📝 Register User API
    app.post("/users", async (req, res) => {
      const { email, name } = req.body;

      if (!email || !name) {
        return res.status(400).json({ error: "Email and name are required" });
      }

      try {
        const existingUser = await usersCollection.findOne({ email });

        if (existingUser) {
          return res.status(400).json({ error: "User already exists" });
        }

        const newUser = { email, name };
        await usersCollection.insertOne(newUser);
        res.status(201).json({ message: "User registered successfully" });
      } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Add a New Task
    app.post("/tasks", async (req, res) => {
      try {
        const newTask = req.body;
        const result = await taskCollection.insertOne(newTask);
        res.status(201).json(result);
      } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).json({ error: "Failed to add task" });
      }
    });

    // Get All Tasks
    app.get("/tasks", async (req, res) => {
      try {
        const tasks = await taskCollection.find().toArray();
        res.json(tasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Error fetching tasks" });
      }
    });

    // Update a Task
    app.put("/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = req.body;
        const result = await taskCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        if (result.modifiedCount === 0) {
          return res.status(404).json({ error: "Task not found" });
        }

        res.json({ message: "Task updated successfully", result });
      } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: "Error updating task" });
      }
    });

    //  Delete a Task
    app.delete("/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await taskCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Task not found" });
        }

        res.json({ message: "Task deleted successfully", result });
      } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: "Error deleting task" });
      }
    });

    // Root Route
    app.get("/", async (req, res) => {
      res.send("✅ TaskNest API is running...");
    });

    // Start Server AFTER successful DB connection
    app.listen(port, () => {
      console.log(`TaskNest Server is running on Port: ${port}`);
    });
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    process.exit(1); // Stop the server if DB connection fails
  }
}

// 🔄 Start the Server
run().catch(console.dir);
