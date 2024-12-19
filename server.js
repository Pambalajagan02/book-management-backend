const express = require("express");
require('dotenv').config();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const cors = require('cors');
app.use(express.json()) 
app.use(cors());
app.use(express.urlencoded({ extended: true })); 
let db = null
 const dbpath = process.env.DATABASE_PATH;
 const port = process.env.PORT || 3001; 

 

//production*---------------------------------------------------------------production

if (process.env.NODE_ENV === "production") {
  // Serve static files from the React app's build folder
  
  app.use(express.static(path.join(__dirname, '../','books-management-frontend', 'build')));

  // Handle all requests by sending back the index.html
  app.get("*", (req, res) => {

    res.sendFile((path.resolve(__dirname,"../", 'books-management-frontend', 'build')));
    
  });
} else {
  // In development mode, just show API status
  app.get("/", (req, res) => {
    res.send("API Running Successfully");
  });
}



//production*----------------------------------------------------------------production













const intializeConnection = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(port, () => {
      console.log(`server started at localhost:${3001}`)
    })
  } catch (e) {
    console.log(`error in connecting ${e.message}`)
    process.exit(1)
  }
}
intializeConnection() 

app.get('/addbook/authors', async (req, res) => {
    const authorsQuery = 'SELECT * FROM Authors;';
    try {
        const dbResponse = await db.all(authorsQuery);  // Use .all() for SELECT queries
        if (dbResponse.length > 0) {
            res.status(200).json(dbResponse);  // Send the response along with the status code
        } else {
            res.status(404).json({ message: 'No authors found' });  // If no authors are found, return a 404
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });  // Handle errors
    }
}); 


app.get('/addbook/genres', async (req, res) => {
    const genresQuery = 'SELECT * FROM genres;';
    try {
        const dbResponse = await db.all(genresQuery);  // Use .all() for SELECT queries, it return arrray of items
        if (dbResponse.length > 0) {
            res.status(200).json(dbResponse);  // Send the response along with the status code
        } else {
            res.status(404).json({ message: 'No genres found' });  // If no authors are found, return a 404
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });  // Handle errors
    }
}); 


app.post('/addbook', async (req,res)=>{ 
  console.log("enter------------------");
  const adddetails= req.body;
  console.log(adddetails);
  try{
    const insertQuery=`insert into Books (Title, AuthorId, GenreId,Pages,PublishedDate) values ('${adddetails.bookTitle}',${adddetails.selectAuthor},${adddetails.selectGenre},${adddetails.Pages},${adddetails.date});`;
    await db.run(insertQuery) 
    console.log("Book added successfully");
    res.status(200).send('Book created successfully');
  }
  catch(error){
    res.status(500).json({ message: 'Server error', error: error.message });  // Handle errors
  }
}); 


app.get('/search', async (req, res)=>{
  const details= req.query

  const {searchText,authorId,genreId}=details

  try {
    // Construct the SQL query dynamically based on the provided parameters
    let query = 'SELECT * FROM Books WHERE 1=1';
    
    if (searchText) {
      query += ` AND Title LIKE '%${searchText}%'`;
    }
    if (authorId) {
      query += ` AND AuthorId = ${authorId}`;
    }
    if (genreId) {
      query += ` AND GenreId = ${genreId}`;
    }
    
    const results = await db.all(query);
    
    // Send the results back to the frontend
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching books', error: error.message });
  }
})

app.delete('/delete-book/:id/', async(req,res)=>{ 
  console.log("enter-----------------")
  const {id} = req.params  
  try {
    const deleteQuery = `DELETE FROM Books WHERE BookId = ?`;
    const result = await db.run(deleteQuery, [id]);

    if (result.changes > 0) {
      res.status(200).json({ message: "Book deleted successfully" });
    } else {
      res.status(404).json({ message: "Book not found" });
    }
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }


}) 

app.get('/book-details/:bookId', async (req, res) => {
  const {bookId} = req.params
  console.log(bookId)
  const genresQuery = `SELECT 
  Books.BookID, 
  Books.Title, 
  Books.Pages, 
  Books.PublishedDate, 
  Authors.Name AS AuthorName, 
  Genres.Name AS GenreName,
  Genres.Description AS GenreDescription
FROM 
  Books 
INNER JOIN 
  Authors ON Books.AuthorID = Authors.AuthorID
INNER JOIN 
  Genres ON Books.GenreID = Genres.GenreID
WHERE 
  Books.BookID = ${bookId};`;
;
  try {
      const dbResponse = await db.get(genresQuery);  // Use .all() for SELECT queries, it return arrray of items
      if (dbResponse) {
          res.status(200).json(dbResponse);  // Send the response along with the status code
      } else {
          res.status(404).json({ message: 'No book found' });  // If no authors are found, return a 404
      }
  } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });  // Handle errors
  }
}); 


app.put('/edit-book/:bookId/', async (req, res) => {
  const updateDetails = req.body;
  const { bookTitle, selectAuthor, selectGenre, Pages, date } = updateDetails;
  const { bookId } = req.params;

  console.log(updateDetails);
  console.log(bookId);

  try {
    const updateQuery = `
      UPDATE Books 
      SET Title = ?, 
          AuthorID = ?, 
          GenreId = ?, 
          Pages = ?, 
          PublishedDate = ? 
      WHERE BookID = ?;
    `;

    // Execute the query with parameters
    await db.run(updateQuery, [bookTitle, selectAuthor, selectGenre, Pages, date, bookId]);

    res.status(200).send({ message: "Book updated successfully" });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).send({ message: "Failed to update book", error });
  }
});
