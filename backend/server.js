const express = require("express");
const cors = require("cors");
const { connection } = require("./db");
const { userRouter } = require("./routes/user.route");
const { noteRouter } = require("./routes/note.route");
const { auth } = require("./middlewere/auth.middlewere");

const app = express();

app.use(cors());
app.use(express.json());

// User Router (/register, /login, /logout)
app.use("/user", userRouter);

app.get("/", (req, res) => {
  res.send("HOME Page");
});

// Protected Note Router (/create, /read, /read/:id, /update/:id, /delete/:id)
app.use("/note", auth, noteRouter);

app.listen(8080, async () => {
  try {
    await connection;
    console.log("DB Connected");
  } catch (error) {
    console.log(error);
  }
  console.log("Server started");
});