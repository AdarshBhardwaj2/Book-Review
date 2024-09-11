import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "bookReview",
  password: "Postgres@123",
  port: 5432,
});

db.connect();
const apiUrl = "https://covers.openlibrary.org/b/id";

app.get("/", (req, res) => {
  res.render("home.ejs");
});

function isNumber(value) {
  return value.trim() !== "" && !isNaN(value) && !isNaN(parseFloat(value));
}

async function getBookIdFromTitle(title) {
  try {
    const response = await axios.get(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`
    );
    const data = response.data;

    // Check if there are any results
    if (data.docs && data.docs.length > 0) {
      // Extract the first book result
      const book = data.docs[0];

      // You can get the ISBN, OLID, or other IDs
      const isbn = book.isbn ? book.isbn[0] : null;
      const olid =
        book.cover_edition_key ||
        (book.edition_key ? book.edition_key[0] : null);

      return { isbn, olid };
    } else {
      console.log("Book not found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching book data:", error);
    return null;
  }
}

app.get("/view", async (req, res) => {
  const result = await db.query("Select * from bookStore order by rating DESC");
  const items = result.rows;
  res.render("index.ejs", { listItems: items });
});

app.post("/add", async (req, res) => {
  const rating = req.body.rating;
  const bookName = req.body.name;
  const authorname = req.body.author;
  const description = req.body.description;

  console.log(authorname);
  console.log(description);

  const bookId = await getBookIdFromTitle(bookName);
  const isbnId = bookId.isbn;

  const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbnId}-M.jpg`;
  console.log("Cover URL:", coverUrl);

  try {
    await db.query(
      "Insert into bookStore (name,authorname,description,rating,coverUrl) values ($1,$2,$3,$4,$5)",
      [bookName, authorname, description, rating, coverUrl]
    );
  } catch (err) {
    console.error(err);
  }

  const result = await db.query("Select * from bookStore order by rating DESC");
  const items = result.rows;
  console.log(items);

  if (isNumber(req.body.rating)) {
    res.render("index.ejs", { listItems: items });
  } else {
    res.status(400).json({ error: "Enter a Number in rating" });
  }
});

app.get("/view/delete/:id", async (req, res) => {
  const bookId = req.params.id;
  console.log(bookId);
  try {
    // Delete the book entry from the database
    await db.query("DELETE FROM bookStore WHERE id = $1", [bookId]);
    console.log(`Deleted book with ID: ${bookId}`);

    // Redirect back to the view page after deletion
    res.redirect("/view");
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).send("Error deleting book");
  }
});

app.get("/view/update/:id", async (req, res) => {
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
