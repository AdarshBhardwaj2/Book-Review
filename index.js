import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 4000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {});

app.post("/add", (req, res) => {
  res.render();
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
