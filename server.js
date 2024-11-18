const http = require('http');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { parse } = require('querystring');
const { URL } = require('url');
const nodemailer = require('nodemailer');
const formidable = require('formidable');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads');  // Correct directory path as string

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// JWT secret key
const JWT_SECRET = 'your_jwt_secret_key_';

// MySQL connection
const connection = mysql.createConnection({
  host: 'database-1.czkmaymg2cn3.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'HAze179416$%',
  database: 'librarydb'
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL database as id ' + connection.threadId);
});


// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });








// Helper function to parse incoming JSON body
const getRequestData = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Middleware to authenticate JWT token
const authenticateToken = (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    console.log("No token provided");
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'No token provided' }));
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded; // Return decoded user data (contains email and id)
  } catch (err) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Invalid token' }));
    return null;
  }
};


// Create an HTTP server
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  console.log(`Incoming request: ${req.method} ${req.url}`);
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }


 // Test Route
 if (req.method === 'GET' && req.url === '/test') {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Test route working' }));
  return;
}

                                                // Claudette Code



    ////search the entire catalog

    if (req.method === 'GET' && req.url.startsWith('/search')) {
      const urlParams = new URLSearchParams(req.url.split('?')[1]);
      const term = urlParams.get('term');
      
      if (!term) {
        res.end(JSON.stringify({ error: 'term query parameter is required' }));
        return;
      }
      const sql = `
      SELECT *,
      SUM(
          CASE 
              WHEN source = 'book' AND status = 'available' THEN 1
              WHEN source IN ('audiobook', 'ebook', 'periodical') AND status = 1 THEN 1
              ELSE 0
          END
      ) AS available_count,
      CASE 
          WHEN source = 'book' THEN 2
          WHEN source = 'audiobook' THEN 1
          WHEN source = 'ebook' THEN 1
          WHEN source = 'periodical' THEN 0.5
          ELSE 0.5
      END AS relevance 
      FROM (
        SELECT isbn, book_id AS id, book_title AS title, author, publisher, book_status as status, deleted, 'book' AS source
        FROM book 
        WHERE MATCH (isbn, book_title, author) AGAINST (? IN BOOLEAN MODE)
        
        UNION ALL
  
        SELECT audio_isbn AS isbn, audiobook_id AS id, audio_title AS title, audio_author AS author, audio_publisher AS publisher, availability as status, deleted, 'audiobook' AS source
        FROM audiobook
        WHERE MATCH (audio_isbn, audio_title, audio_author) AGAINST (? IN BOOLEAN MODE)
  
        UNION ALL
  
        SELECT ebook_isbn AS isbn, ebook_id AS id, ebook_title AS title, ebook_author AS author, ebook_publisher AS publisher, availability as status, deleted, 'ebook' AS source
        FROM ebook
        WHERE MATCH (ebook_isbn, ebook_title, ebook_author) AGAINST (? IN BOOLEAN MODE)
  
        UNION ALL
  
        SELECT periodical_issn AS isbn, periodical_id AS id, periodical_title AS title, periodical_author AS author, periodical_publisher AS publisher, availability as status, deleted, 'periodical' AS source
        FROM periodical
        WHERE MATCH (periodical_issn, periodical_title, periodical_author) AGAINST (? IN BOOLEAN MODE)
      ) AS combined 
      GROUP BY isbn, title, author, publisher, source
      ORDER BY relevance DESC, available_count DESC;
  `;
  
    const likeTerm = `${term}%`; // Use wildcards for LIKE
    
    console.log('Executing query:', sql, 'with parameters:', [`${term}%`]);
    connection.query(sql, [term, term, term, term], (error, results) => {
         if (error) {
            res.end(JSON.stringify({ error: 'Database error' }));
            return;
          }
  
          return res.end(JSON.stringify(results || []));    
      });
    }
  
   //get data from server for one book
    if (req.method === 'GET' && req.url.startsWith('/book')){
      const urlParts = req.url.split('/');
      const bookId = urlParts[2];
  
      if(!bookId){
        res.end(JSON.stringify({ error: 'Book ID is required' }));
        return;
      }
  
      const sql = `
        SELECT *,
        book_title AS title,
        COUNT(*) AS duplicate_count, 
        COUNT(CASE WHEN book_status = 'available' THEN 1 END) AS available_count
        FROM book
        WHERE isbn = (SELECT isbn FROM book WHERE book_id = ?);
        `;
  
      connection.query(sql, [bookId], (error, results) => {
        if (error) {
          res.end(JSON.stringify({ error: 'Database error' }));
          return;
        }
      
        if (results.length === 0) {
          return res.end(JSON.stringify({ error: 'Book not found' }));
        }
        
        res.end(JSON.stringify(results[0]));
  
      });
    }
  
    ////END TEST//////
    
    ////get all book catalog
    if (req.method === 'GET' && req.url === ('/catalog')) {
     
      const sql = `SELECT *, 'book' AS source FROM book;
    `;
  
    connection.query(sql, (error, results) => {
         if (error) {
            res.end(JSON.stringify({ error: 'Error fetching catalog data' }));
            return;
          }
  
          return res.end(JSON.stringify(results || []));    
      });
    }
  
  
  
   //send book data to a server
   if(req.method === 'POST' && req.url === '/book-entry') {
    let body = '';
  
    req.on('data', (chunk) => {
      body += chunk.toString(); //convert buffer to string
    });
    req.on('end', () => {
  
        const bookEntryData = JSON.parse(body);
        const { bIsbn,  bAuthor, bTitle, bCategory,
          bYear, bEdition, bNumCopies, bMediaType, bPublisher, 
          bNumPages, bLang, bSummary, bNotes, bStatus } = bookEntryData
        
      //would check for existing book. is this necessary tho
      //const checkSql = 'SELECT * FROM books WHERE isbn = ?';
        const insertSql = 
        'INSERT INTO book (isbn, author, book_title, book_category, year_copyright, edition, availability, media_type, publisher, num_pages, language, book_summary, book_notes, book_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        
        connection.query(insertSql, [bIsbn, bAuthor, bTitle, bCategory,
          bYear, bEdition, bNumCopies, bMediaType, bPublisher, bNumPages, bLang, 
          bSummary, bNotes, bStatus], (err, result) => {
          if (err) {
            console.error('Error inserting book data: ', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error inserting book data' }));
            return;
          }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Book added successfully' }));
      });
    });
  }
  
  ////UPDATE BOOK !!
  if (req.method === 'PUT' && req.url === '/book-entry') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const bookData = JSON.parse(body);
      const {
        book_id, bIsbn, bAuthor, bTitle, bCategory, bYear, bEdition, bNumCopies,
        bMediaType, bPublisher, bNumPages, bLang, bSummary, bNotes
      } = bookData;
  
      const updateSql = `
        UPDATE book SET isbn = ?, author = ?, book_title = ?, book_category = ?,
        year_copyright = ?, edition = ?, availability = ?, media_type = ?, publisher = ?,
        num_pages = ?, language = ?, book_summary = ?, book_notes = ?
        WHERE book_id = ?
      `;
  
      connection.query(updateSql, [
        bIsbn, bAuthor, bTitle, bCategory, bYear, bEdition, bNumCopies,
        bMediaType, bPublisher, bNumPages, bLang, bSummary, bNotes, book_id
      ], (err, result) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Error updating book data' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Book updated successfully' }));
      });
    });
  }
  
  ////DELETE BOOK 
  
  if (req.method === 'PUT' && req.url === '/soft-delete-book') {
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
  
      const data = JSON.parse(Buffer.concat(buffers).toString());
      const { book_id } = data;
  
      if (!book_id) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: 'Book ID is required' }));
        return;
      }
  
      // Update the deleted column to 1 (true)
      const query = `UPDATE book SET deleted = 1 WHERE book_id = ?`;
      
      connection.query(query, [book_id], (err, result) => {
        if (err) {
          console.error('Database Error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Error deleting book' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Book marked as deleted successfully' }));
      });
    } catch (error) {
      console.error('Error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ message: 'Internal Server Error' }));
    }
  }
  
  //////RESTORE A BOOK
  
  if (req.method === 'PUT' && req.url === '/restore-book') {
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
  
      const data = JSON.parse(Buffer.concat(buffers).toString());
      const { book_id } = data;
  
      if (!book_id) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: 'Book ID is required' }));
        return;
      }
  
      // Update the deleted column to 0 (false) to restore the book
      const query = `UPDATE book SET deleted = 0 WHERE book_id = ?`;
      
      connection.query(query, [book_id], (err, result) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Error restoring book' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Book restored successfully' }));
      });
    } catch (error) {
      console.error('Error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ message: 'Internal Server Error' }));
    }
  }
  
  ////CHECKOUT BOOK!!!!
  
  if (req.method === 'PUT' && req.url === '/checkout') {
    const decoded = authenticateToken(req, res);
    if (!decoded) return;
  
    console.log("Decoded token:", decoded);
  
    let body = '';
  
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
  
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { book_id } = data;
  
        if (!book_id) {
          res.statusCode = 400;
          res.end(JSON.stringify({ message: 'Book ID is required.' }));
          return;
        }
  
        // Check the status of the specified book
        const statusQuery = `SELECT isbn, book_status FROM book WHERE book_id = ?`;
        connection.query(statusQuery, [book_id], (err, statusResult) => {
          if (err || statusResult.length === 0) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error fetching book status or book not found.' }));
            return;
          }
  
          const { isbn, book_status } = statusResult[0];
  
          const handleReservationInsert = (selectedBookId) => {
            // Create reservation record
            const userId = decoded.user_ID;
            const dateBorrowed = new Date();
            const dueDate = new Date();
            dueDate.setDate(dateBorrowed.getDate() + 14);
  
            const insertReservationQuery = `
              INSERT INTO book_reservations (user_id, book_id, reservation_status, queue_position, date_borrowed, date_due)
              VALUES (?, ?, 'fulfilled', 0, ?, ?);
            `;
  
            connection.query(
              insertReservationQuery,
              [userId, selectedBookId, dateBorrowed, dueDate],
              (err, reservationResult) => {
                if (err) {
                  console.error('Error creating reservation record:', err);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ message: 'Error creating reservation record.' }));
                  return;
                }
  
                // Update the status of the book to 'checked_out'
                const updateQuery = `
                  UPDATE book 
                  SET book_status = 'checked_out' 
                  WHERE book_id = ?;
                `;
                connection.query(updateQuery, [selectedBookId], (err, updateResult) => {
                  if (err) {
                    console.error('Error updating book status:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Error updating book status.' }));
                    return;
                  }
  
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    message: 'Book successfully checked out.',
                    book_id: selectedBookId,
                    reservation_id: reservationResult.insertId,
                  }));
                });
              }
            );
          };
  
          if (book_status === 'available') {
            // The specified book is available, proceed with reservation
            handleReservationInsert(book_id);
          } else {
            // The specified book is not available, find another available copy
            const findAvailableQuery = `
              SELECT book_id 
              FROM book 
              WHERE isbn = ? AND book_status = 'available'
              LIMIT 1;
            `;
            connection.query(findAvailableQuery, [isbn], (err, availableResult) => {
              if (err || availableResult.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'No available copies found.' }));
                return;
              }
  
              const nextAvailableBookId = availableResult[0].book_id;
              handleReservationInsert(nextAvailableBookId);
            });
          }
        });
      } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal server error.' }));
      }
    });
  }
  
    //send audiobook data to server
  if (req.method === 'POST' && req.url === '/catalog-entry/audiobook') {
    // Authenticate the request using JWT token (same as in the ProfilePage)
    const user = authenticateToken(req, res);
    if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Authentication required' }));
        return; // If the token is invalid or missing, return
    }

    // Handle the multipart/form-data (file upload)
    upload.single('abFile')(req, res, (err) => {
        if (err) {
            console.error('Error handling file upload:', err);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error uploading file' }));
            return;
        }

        // Process form data after file upload
        const { abISBN, abTitle, abAuthor, abNarrator, abPublisher, abCategory, abEdition, abLanguage, abDate, abDuration, abFormat, abSummary, abNotes } = req.body;
        const abFilePath = req.file ? req.file.path : ''; // Get the file path

        // Log incoming data for debugging
        console.log("Received audiobook data:", { abISBN, abTitle, abAuthor, abNarrator, abPublisher, abCategory, abEdition, abLanguage, abDate, abDuration, abFormat, abSummary, abNotes, abFilePath });

        // Validate the required fields
        if (!abISBN || !abTitle || !abAuthor || !abNarrator || !abPublisher || !abCategory || !abLanguage || !abDate || !abDuration || !abFormat) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'All required fields must be provided' }));
            return;
        }

        // SQL query to insert the audiobook entry
        const insertSql = `
            INSERT INTO audiobook 
            (audio_file, audio_isbn, audio_title, audio_author, audio_narrator, audio_publisher, audio_category, audio_edition, audio_language, date_published, duration, format, availability, audio_summary, audio_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Insert the audiobook data into the database
        connection.query(insertSql, [
            abFilePath, abISBN, abTitle, abAuthor, abNarrator, abPublisher, abCategory, abEdition,
            abLanguage, abDate, abDuration, abFormat, 1, abSummary, abNotes
        ], (err, result) => {
            if (err) {
                console.error('Error inserting audiobook data:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Error inserting audiobook data' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Audiobook added successfully' }));
        });
    });
}
  
   //send ebook data to server
   if(req.method === 'POST' && req.url === '/catalog-entry/ebook') {
    let body = '';
  
    req.on('data', (chunk) => {
      body += chunk.toString(); //convert buffer to string
    });
    req.on('end', () => {
  
        const ebookEntryData = JSON.parse(body);
        const { ebIsbn, ebTitle, ebAuthor, ebPublisher, 
          ebCategory, ebEdition, ebLanguage, ebDate,
          ebFormat, ebUrl, ebAccessType, ebSummary, ebNotes } = ebookEntryData
        
      //would check for existing book. is this necessary tho
      //const checkSql = 'SELECT * FROM books WHERE isbn = ?';
        const insertSql = 
        'INSERT INTO ebook (ebook_isbn, ebook_title, ebook_author, ebook_publisher, ebook_category, ebook_edition, ebook_language, ebook_year, resource_type, url, access_type, availability, ebook_summary, ebook_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        
        connection.query(insertSql, [ebIsbn, ebTitle, ebAuthor, ebPublisher, 
          ebCategory, ebEdition, ebLanguage, ebDate,
          ebFormat, ebUrl, ebAccessType, 1, ebSummary, ebNotes], (err, result) => {
          if (err) {
            console.error('Error inserting eBook data: ', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error inserting ebook data' }));
            return;
          }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'eBook added successfully' }));
      });
    });
  }
  
  
      //send periodical data to server
      if(req.method === 'POST' && req.url === '/catalog-entry/periodical') {
        let body = '';
    
        req.on('data', (chunk) => {
          body += chunk.toString(); //convert buffer to string
        });
        req.on('end', () => {
    
            const pEntryData = JSON.parse(body);
            const { pIssn, pTitle, pAuthor, pType, pPublisher, pCategory,
              pFormat, pUrl, pFrequency, pIssueDate, pIssueVolume, pIssueNumber,
              pLanguage, pDescription, pNotes } = pEntryData
            
          //would check for existing book. is this necessary tho
          //const checkSql = 'SELECT * FROM books WHERE isbn = ?';
            const insertSql = 
            'INSERT INTO periodical (periodical_issn, periodical_title, periodical_author, periodical_type, periodical_publisher, periodical_category, periodical_format, periodical_url, frequency, issue_date, issue_volume, issue_number, periodical_language, availability, periodical_description, periodical_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            
            connection.query(insertSql, [pIssn, pTitle, pAuthor, pType, pPublisher, pCategory,
              pFormat, pUrl, pFrequency, pIssueDate, pIssueVolume, pIssueNumber,
              pLanguage, 1, pDescription, pNotes], (err, result) => {
              if (err) {
                console.error('Error inserting periodical data: ', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Error inserting periodical data' }));
                return;
              }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Periodical added successfully' }));
          });
        });
      }
  
      if (req.method === 'GET' && req.url.startsWith('/reviews/')) {
        // Extract ISBN from the URL
        const urlParts = req.url.split('/');
        const isbn = urlParts[2];
    
        if (!isbn) {
            res.statusCode = 400; // Bad Request
            return res.end(JSON.stringify({ error: 'ISBN is required' }));
        }
    
        // Query to fetch reviews for the book using the provided ISBN
        const reviewsQuery = `
            SELECT f.description, f.rating, f.book_isbn, f.date_submitted, f.user_id, u.first_name
            FROM feedback f
            JOIN user u ON f.user_id = u.user_id
            WHERE f.book_isbn = ?
            ORDER BY f.date_submitted DESC;
        `;
    
        connection.query(reviewsQuery, [isbn], (reviewsError, reviewsResults) => {
            if (reviewsError) {
                res.statusCode = 500; // Internal Server Error
                return res.end(JSON.stringify({ error: 'Database error fetching reviews' }));
            }
    
            if (reviewsResults.length === 0) {
              res.statusCode = 200; // OK
              return res.end(JSON.stringify([]));
            }
    
            // Return the reviews data
            res.statusCode = 200; // OK
            res.end(JSON.stringify(reviewsResults));
        });
    }
  
  //////////GET ALL BOOKS CHECKED OUT BY USER::
  
  if (req.method === 'GET' && req.url === '/user/book_reservations') {
    try {
      console.log('Attempting to fetch book reservations...');
      const decoded = authenticateToken(req, res);
      if (!decoded) return;
  
      console.log("Decoded token:", decoded); // Log the decoded token
  
      // Query to fetch book reservations for the user
      const reservationsQuery = `
        SELECT br.reservation_id, br.reservation_date_time, br.reservation_status, br.queue_position, br.date_borrowed, br.date_due, br.date_returned,
               b.book_id, b.isbn, b.book_title, b.author, b.book_status
        FROM book_reservations br
        JOIN book b ON br.book_id = b.book_id
        WHERE br.user_id = ?
        ORDER BY br.reservation_date_time DESC;
      `;
  
      // Execute the query
      connection.query(reservationsQuery, [decoded.user_ID], (error, results) => {
        if (error) {
          console.error('Error fetching book reservations:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to retrieve book reservations' }));
          return;
        }
  
        if (results.length === 0) {
          console.log('No reservations found for this user.');
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'No reservations found for this user' }));
          return;
        }
  
        console.log('Book reservations fetched successfully:', results);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results));
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'An unexpected error occurred' }));
    }
  }
  
  ///////USER BOOKS CHECKED OUT END
  
  
  ///////RETURN BOOK START
  
  if (req.method === 'PUT' && req.url === '/return-book') {
    const decoded = authenticateToken(req, res);
      if (!decoded) return;
  
      console.log("Decoded token:", decoded); // Log the decoded token
    let body = '';
  
    // Collect the data from the request
    req.on('data', chunk => {
      body += chunk;
    });
  
    req.on('end', () => {
      try {
        const { reservation_id, book_id } = JSON.parse(body); // Get reservation_id and book_id from body
  
        if (!reservation_id || !book_id || !decoded.user_ID) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Reservation ID and Book ID are required' }));
        }
        console.log(`Returning book with ID: ${book_id} for reservation ID: ${reservation_id}`);
        // Start a transaction
        connection.beginTransaction((err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Transaction start failed' }));
          }
  
          // Update the book status to 'available'
          const updateBookQuery = `
            UPDATE book
            SET book_status = 'available'
            WHERE book_id = ?
          `;
          connection.query(updateBookQuery, [book_id], (err, result) => {
            if (err) {
              return connection.rollback(() => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Failed to update book status' }));
              });
            }
  
            // Update the reservation's date_returned to the current time
            const updateReservationQuery = `
              UPDATE book_reservations
              SET date_returned = NOW(), reservation_status = 'returned'
              WHERE reservation_id = ? AND book_id = ? AND user_id = ?
            `;
            connection.query(updateReservationQuery, [reservation_id, book_id, decoded.user_ID], (err, result) => {
              if (err) {
                return connection.rollback(() => {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ error: 'Failed to update reservation return date' }));
                });
              }
  
              // Commit the transaction
              connection.commit((err) => {
                if (err) {
                  return connection.rollback(() => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Transaction commit failed' }));
                  });
                }
  
                // Respond with success
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ message: 'Book returned successfully' }));
              });
            });
          });
        });
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
  }
  
  ///////////////RETURN BOOK END

  ///////cancel reservation start

if (req.method === 'PUT' && req.url === '/cancel-reservation') {
  const decoded = authenticateToken(req, res);
    if (!decoded) return;

    console.log("Decoded token:", decoded); // Log the decoded token
  try {
    console.log('Attempting to cancel reservation...');
    const decoded = authenticateToken(req, res);
    if (!decoded) return; // If token is invalid or not provided, stop execution

    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      const { reservation_id, book_id } = JSON.parse(body);

      if (!reservation_id || !book_id || !decoded.user_ID) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: 'Missing required fields' }));
        return;
      }

      // SQL query to cancel reservation
      const cancelReservationQuery = `
        UPDATE book_reservations
        SET reservation_status = 'cancelled', queue_position = -1
        WHERE reservation_id = ? AND book_id = ? AND user_id = ?;
      `;

      connection.query(cancelReservationQuery, [reservation_id, book_id, decoded.user_ID], (error, results) => {
        if (error) {
          console.error('Error cancelling reservation:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to cancel reservation' }));
          return;
        }

        if (results.affectedRows === 0) {
          console.log('No reservation found to cancel.');
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Reservation not found or already canceled' }));
          return;
        }

        console.log('Reservation canceled successfully:', results);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Reservation canceled successfully' }));
      });
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'An unexpected error occurred' }));
  }
}



//////cancel reservation end

/////////STAFF CHOICE BOOKS START

if (req.method === 'GET' && req.url === '/staff-choice') {
  // Query to get staff choice details from `staff_choice` and join with `book`
  const query = `
      SELECT sc.choice_id AS choice_id, 
             sc.book_id, 
             b.book_title AS book_title, 
             b.author AS book_author, 
             b.book_category AS book_category,
             b.isbn AS isbn, 
             sc.selected_date
      FROM staff_choice sc
      INNER JOIN book b ON sc.book_id = b.book_id
  `;

  connection.query(query, (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Error retrieving data from the database' }));
          return;
      }

      if (results.length === 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'No staff choice found' }));
          return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
  });
}

////////STAFF CHOICE BOOKS END

///LATEST ENTRIES BOOKS START

if (req.method === 'GET' && req.url === '/latest-entries') {
  // SQL query to fetch all data from the `top_books` view
  const query = 'SELECT * FROM top_books';

  connection.query(query, (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Error retrieving data from the database' }));
          return;
      }

      if (results.length === 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'No top books found' }));
          return;
      }

      // Return the results from the top_books view
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
  });
}

///////LATEST ENTRIES BOOKS END


/////////ADD BOOK TO LIST
if (req.method === 'POST' && req.url === '/add-to-list') {
  const decoded = authenticateToken(req, res);
  if (!decoded) return;

  console.log("Decoded token:", decoded);
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString(); // Collect the request body
    });

    req.on('end', () => {
      const { book_id, isbn } = JSON.parse(body);

      if (!book_id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Book ID is required' }));
        return;
      }

      // Insert the user_id and book_id into the database
      const query = 'INSERT INTO user_list (user_id, book_id, book_isbn) VALUES (?, ?, ?)';
      connection.query(query, [decoded.user_ID, book_id, isbn], (err, result) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Failed to add book to list', error: err }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Book added to list successfully' }));
      });
    });
  }


/////////////ADD BOOK TO LIST END

////CHECK USER LIST 


if (req.method === 'GET' && req.url.startsWith('/user-list')) {
  const decoded = authenticateToken(req, res);
  if (!decoded) return;

  console.log("Decoded token:", decoded);

  const isbn = req.url.split('/user-list/')[1];

  if (!isbn) {
    res.statusCode = 400;
    res.end('ISBN is required');
    return;
  }

  console.log('Received ISBN:', isbn);

    const sql = `
      SELECT *
      FROM user_list
      WHERE user_id = ? AND book_isbn = ?
    `;

    connection.query(sql, [decoded.user_ID, isbn], (error, results) => {
      if (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Database error' }));
        return;
      }

      if (results.length === 0) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([])); // Return an empty array if no books are found
        return;
      }
      console.log('Backend query results:', results);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    });
}

////CHECK USER LIST END

////////DELETE BOOK FROM USER LIST START

if (req.method === 'DELETE' && req.url === '/user-list') {
  const decoded = authenticateToken(req, res);
  if (!decoded) return;

  console.log("Decoded token:", decoded);

  let body = '';

  // Collect data from the request body
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    const { book_id, isbn } = JSON.parse(body);
    
    if (!book_id || !isbn || !decoded) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing book_id, isbn, or token' }));
      return;
    }

    try {

      // Delete the entry from the user_list table
      const query = 'DELETE FROM user_list WHERE user_id = ? AND book_id = ?';
      connection.query(query, [decoded.user_ID, book_id], (error, results) => {
        if (error) {
          console.error('Database error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
          return;
        }

        if (results.affectedRows === 0) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Entry not found' }));
        } else {
          console.log(`Deleted book with book_id ${book_id} and isbn ${isbn} for user_id ${decoded.user_ID}`);
          res.statusCode = 200;
          res.end(JSON.stringify({ message: 'Book removed from user list' }));
        }
      });
    } catch (err) {
      console.error('Token error:', err);
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Unauthorized' }));
    }
  });
}

///////////DELETE BOOK FROM USER LIST END

  
  
  
  ///////////// END OF CLAUDETTES CODE /////////////////////////////////////////////////////////////////////////////////////////
  
  
  
  
  






























                                                  //Nicks Code


// Cancel reservation route
else if (req.method === 'POST' && req.url === '/cancel-reservation') {
  const userData = authenticateToken(req, res);
  if (!userData) return;

  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const data = JSON.parse(body);
    const { reservationId, roomId } = data;

    // Check reservation status
    const checkReservationStatusSql = `
      SELECT reservation_status 
      FROM room_reservations 
      WHERE reservation_id = ? AND user_id = ?`;

    connection.query(checkReservationStatusSql, [reservationId, userData.user_ID], (err, results) => {
      if (err) {
        console.error('Error checking reservation status: ', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Error checking reservation status');
        }
        return;
      }

      // If no result is found or the reservation is not ongoing, return an error
      if (results.length === 0) {
        if (!res.headersSent) {
          res.statusCode = 404;
          res.end('Reservation not found');
        }
        return;
      }

      const reservationStatus = results[0].reservation_status;
      if (reservationStatus === 'ended') {
        if (!res.headersSent) {
          res.statusCode = 400;
          res.end('Reservation has already ended');
        }
        return;
      } else if (reservationStatus !== 'ongoing') {
        if (!res.headersSent) {
          res.statusCode = 400;
          res.end('Reservation has already been canceled');
        }
        return;
      }

      // If the reservation is ongoing, proceed with cancellation
      const updateReservationStatusSql = `
        UPDATE room_reservations 
        SET reservation_status = 'canceled' 
        WHERE reservation_id = ? AND user_id = ?`;

      connection.query(updateReservationStatusSql, [reservationId, userData.user_ID], (err, result) => {
        if (err) {
          console.error('Error updating reservation status: ', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end('Error canceling reservation');
          }
          return;
        }

        if (result.affectedRows === 0) {
          if (!res.headersSent) {
            res.statusCode = 404;
            res.end('Reservation not found or already canceled');
          }
          return;
        }

        // Set the room status back to available (room_status = 0)
        const updateRoomStatusSql = 'UPDATE rooms SET room_status = 0 WHERE room_id = ?';
        connection.query(updateRoomStatusSql, [roomId], (err, result) => {
          if (err) {
            console.error('Error updating room status: ', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end('Error updating room status');
            }
            return;
          }

          if (!res.headersSent) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: 'Reservation canceled successfully' }));
          }
        });
      });
    });
  });
  return;
}



 // Create room route
 else if (req.method === 'POST' && req.url === '/create-room') {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const data = JSON.parse(body);
    const { Rnum, Rname, Psize, Requip, Rdescript } = data;

    //check if room number in database already
    const checkSql = 'SELECT * FROM rooms WHERE room_id = ?';

    connection.query(checkSql, [Rnum], (err, results) => {
      if (err) {
        console.error('Error checking room data: ', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Error checking room data');
        }
        return;
      }

      if (results.length > 0) {
        // Room with this room_id already in database
        if (!res.headersSent) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Room with this room number already exists' }));
        }
      } else {
        //Room doesnt exist. good to insert it
        const insertSql = 'INSERT INTO rooms (room_id, room_name, room_capacity, room_equipment, room_description, room_status) VALUES (?, ?, ?, ?, ?, ?)';
        //set room_status to 0 upon creating the room. 0 means vacant.
        connection.query(insertSql, [Rnum, Rname, Psize, Requip, Rdescript, 0], (err, result) => {
          if (err) {
            console.error('Error inserting room data: ', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end('Error inserting room data');
            }
            return;
          }

          if (!res.headersSent) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: 'Room created successfully' }));
          }
        });
      }
    });
  });
  return;
}
  //query rooms for room reservation
  else if (req.method === 'GET' && req.url === '/get-rooms') {
    const sql = 'SELECT room_id, room_name, room_capacity, room_description FROM rooms WHERE room_status = 0';
    connection.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching rooms: ', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Error fetching rooms');
        }
        return;
      }
    
      if (!res.headersSent) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(results));
      }
    });
    return;
  }

  //reserve room route
  else if (req.method === 'POST' && req.url === '/reserve-room') {
    const userData = authenticateToken(req, res);
    if (!userData) return; 

    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const data = JSON.parse(body);
      const { roomId, partySize, reservationDateTime, duration, reservationReason } = data;

      const insertReservationSql = `
        INSERT INTO room_reservations (user_id, room_number, reservation_date, reservation_duration_hrs, party_size, reservation_status, reservation_reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

        const values = [userData.user_ID, roomId, reservationDateTime, duration, partySize, 'ongoing', reservationReason];

      //status should be set to ongoing
      connection.query(insertReservationSql, values, (err, result) => {
        if (err) {
          console.error('Error inserting reservation: ', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end('Error making reservation');
          }
          return;
        }

        //change the room status from available: 0 to in use: 1
        const updateRoomStatusSql = 'UPDATE rooms SET room_status = 1 WHERE room_id = ?';
        connection.query(updateRoomStatusSql, [roomId], (err, result) => {
          if (err) {
            console.error('Error updating room status: ', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end('Error updating room status');
            }
            return;
          }

          if (!res.headersSent) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: 'Room reserved successfully' }));
          }
        });
      });
    });
    return;
  }


  //feedback route
 else if (req.method === 'POST' && req.url === '/feedback') {
  const userData = authenticateToken(req, res);
  if (!userData) return;

  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      const { bookName, bookAuthor, rating, comments, type, bookIsbn } = data;

      if (!bookName || !bookAuthor || !rating || !bookIsbn) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Missing required feedback fields' }));
        return;
      }

      // Insert feedback into the database
      const insertFeedbackSql = `
        INSERT INTO feedback (book_isbn, user_id, book_name, book_author, rating, description, type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        bookIsbn,
        userData.user_ID,
        bookName,
        bookAuthor,
        rating,
        comments || null,
        type || 'general',
      ];

      connection.query(insertFeedbackSql, values, (err, result) => {
        if (err) {
          console.error('Error inserting feedback:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Error submitting feedback' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Feedback submitted successfully' }));
      });
    } catch (error) {
      console.error('Error processing feedback:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  });
}


//reports route
else if (req.method === 'POST' && req.url === '/get-reports') {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const data = JSON.parse(body);
    const { specification, date, user_id, book_name, book_isbn, staff_id, teach_email, laptop_id, calc_id, period_type, room_num } = data;

    let query = '';
    let params = [];

    switch (specification) {
      case 'room reservations':
        query = 'SELECT * FROM room_reservations WHERE 1=1';
        if (date) {
          query += ' AND DATE(reservation_date) = ?';
          params.push(date);
        }
        if (user_id) {
          query += ' AND user_id = ?';
          params.push(user_id);
        }
        if (room_num) {
          query += ' AND room_number = ?';
          params.push(room_num);
        }
        break;

      case 'book reservations':
        query = 'SELECT * FROM book_reservations WHERE 1=1';
        if (date) {
          query += ' AND DATE(reservation_date_time) = ?';
          params.push(date);
        }
        if (user_id) {
          query += ' AND user_id = ?';
          params.push(user_id);
        }
        if (book_name) {
          query += ' AND book_title = ?';
          params.push(book_name);
        }
        break;

      case 'most liked':
          query = `
            SELECT 
                b.book_title, 
                b.author,
                b.isbn, 
                COUNT(DISTINCT r.feedback_id) AS review_count, 
                AVG(r.rating) AS average_rating
            FROM 
                book b
            JOIN 
                feedback r ON b.isbn = r.book_isbn
            GROUP BY 
                b.isbn, b.book_title, b.author
            HAVING 
                COUNT(DISTINCT r.feedback_id) >= 5
            ORDER BY 
                average_rating DESC, review_count DESC
            LIMIT 5;
          `;
          break;

      case 'feedback':
        query = 'SELECT * FROM feedback WHERE 1=1';
        if (date) {
          query += ' AND DATE(date_submitted) = ?';
          params.push(date);
        }
        if (book_name) {
          query += ' AND book_name = ?';
          params.push(book_name);
        }
        break;

      case 'laptops':
        query = 'SELECT * FROM Laptops WHERE 1=1';
        if (laptop_id) {
          query += ' AND laptop_id = ?';
          params.push(laptop_id);
        }
        break;

      case 'calculators':
        query = 'SELECT * FROM Calculators WHERE 1=1';
        if (calc_id) {
          query += ' AND calculator_id = ?';
          params.push(calc_id);
        }
        break;

      case 'books':
        query = 'SELECT * FROM book WHERE 1=1';
        if (date) {
          query += ' AND DATE(date_added) = ?';
          params.push(date);
        }
        if (book_name) {
          query += ' AND book_title = ?';
          params.push(book_name);
        }
        if (book_isbn) {
          query += ' AND isbn = ?';
          params.push(book_isbn);
        }
        break;

      case 'audiobooks':
          query = 'SELECT * FROM audiobook WHERE 1=1';
          if (date) {
            query += ' AND DATE(date_added) = ?';
            params.push(date);
          }
          if (book_name) {
            query += ' AND audio_title = ?';
            params.push(book_name);
          }
          if (book_isbn) {
            query += ' AND audio_isbn = ?';
            params.push(book_isbn);
          }
          break;

      case 'periodical':
          query = 'SELECT * FROM periodical WHERE 1=1';
          if (date) {
            query += ' AND DATE(issue_date) = ?';
            params.push(date);
          }
          if (period_type) {
            query += ' AND periodical_type = ?';
            params.push(period_type);
          }
          break;
      
      case 'ebook':
          query = 'SELECT * FROM ebook WHERE 1=1';
          if (date) {
            query += ' AND DATE(date_added) = ?';
            params.push(date);
          }
          if (book_name) {
            query += ' AND ebook_title = ?';
            params.push(book_name);
          }
          if (book_isbn) {
            query += ' AND ebook_isbn = ?';
            params.push(book_isbn);
          }
          break;
      
      //query all types of media we have
      case 'catalog':
        query = `
          SELECT book_title AS title, isbn, date_added, 'book' AS media_type FROM book
          UNION ALL
          SELECT audio_title AS title, audio_isbn AS isbn, date_added, 'audiobook' AS media_type FROM audiobook
          UNION ALL
          SELECT periodical_title AS title, periodical_issn, issue_date AS date_added, 'periodical' AS media_type FROM periodical
          UNION ALL
          SELECT ebook_title AS title, ebook_isbn AS isbn, date_added, 'ebook' AS media_type FROM ebook
        `;
        break;


      //query all reservations/ checkouts from book, rooms, devices
      case 'transactions':
        query = `
          SELECT 'book' AS media_type, book_title AS item_name, book_id AS item_id, user_id, reservation_date_time AS transaction_date
          FROM book_reservations
          WHERE 1=1
        `;
        
        if (user_id) {
          query += ' AND user_id = ?';
          params.push(user_id);
        }
        if (date) {
          query += ' AND reservation_date_time = ?';
          params.push(date);
        }
        
        query += `
          UNION ALL
          SELECT 'room' AS media_type, room_number AS item_name, room_number AS item_id, user_id, reservation_date AS transaction_date
          FROM room_reservations
          WHERE 1=1
        `;
        
        if (user_id) {
          query += ' AND user_id = ?';
          params.push(user_id);
        }
        if (date) {
          query += ' AND reservation_date = ?';
          params.push(date);
        }
        
        query += `
          UNION ALL
          SELECT 'laptop' AS media_type, model_name AS item_name, laptop_id AS item_id, user_id, reservation_date_time AS transaction_date
          FROM laptop_reservations
          WHERE 1=1
        `;
        
        if (user_id) {
          query += ' AND user_id = ?';
          params.push(user_id);
        }
        if (date) {
          query += ' AND reservation_date_time = ?';
          params.push(date);
        }
        
        query += `
          UNION ALL
          SELECT 'calculator' AS media_type, model_name AS item_name, calculator_id AS item_id, user_id, reservation_date_time AS transaction_date
          FROM calculator_reservations
          WHERE 1=1
        `;
        
        if (user_id) {
          query += ' AND user_id = ?';
          params.push(user_id);
        }
        if (date) {
          query += ' AND reservation_date_time = ?';
          params.push(date);
        }
        break;


      case 'staff':
        query = 'SELECT * FROM staff WHERE 1=1';
        if (date) {
          query += ' AND DATE(date_hired) = ?';
          params.push(date);
        }
        if (staff_id) {
          query += ' AND staff_id = ?';
          params.push(staff_id);
        }
        break;
      
      case 'teacher':
        query = 'SELECT * FROM teacher WHERE 1=1';
        if (teach_email) {
          query += ' AND email = ?';
          params.push(teach_email);
        }
        break;

      case 'users':
        query = 'SELECT * FROM user WHERE 1=1';
        if (date) {
          query += ' AND DATE(create_time) = ?';
          params.push(date);
        }
        if (user_id) {
          query += ' AND user_id = ?';
          params.push(user_id);
        }
        break;


        case 'user transactions':
          query = `
            SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS username, u.email, 'book' AS media_type, br.book_title AS item_name, br.book_id AS item_id, br.reservation_date_time AS transaction_date
            FROM user u
            JOIN book_reservations br ON u.user_id = br.user_id
            WHERE 1=1
          `;
          if (user_id) {
            query += ' AND u.user_id = ?';
            params.push(user_id);
          }
          if (date) {
            query += ' AND br.reservation_date_time = ?';
            params.push(date);
          }

          query += ` 
            UNION ALL
            SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS username, u.email, 'room' AS media_type, rr.room_number AS item_name, rr.room_number AS item_id, rr.reservation_date AS transaction_date
            FROM user u
            JOIN room_reservations rr ON u.user_id = rr.user_id
            WHERE 1=1
          `;
          if (user_id) {
            query += ' AND u.user_id = ?';
            params.push(user_id);
          }
          if (date) {
            query += ' AND rr.reservation_date = ?';
            params.push(date);
          }

          query += `
            UNION ALL
            SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS username, u.email, 'laptop' AS media_type, lr.model_name AS item_name, lr.laptop_id AS item_id, lr.reservation_date_time AS transaction_date
            FROM user u
            JOIN laptop_reservations lr ON u.user_id = lr.user_id
            WHERE 1=1
          `;
          if (user_id) {
            query += ' AND u.user_id = ?';
            params.push(user_id);
          }
          if (date) {
            query += ' AND lr.reservation_date_time = ?';
            params.push(date);
          }

          query += `
            UNION ALL
            SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS username, u.email, 'calculator' AS media_type, cr.model_name AS item_name, cr.calculator_id AS item_id, cr.reservation_date_time AS transaction_date
            FROM user u
            JOIN calculator_reservations cr ON u.user_id = cr.user_id
            WHERE 1=1
          `;
          if (user_id) {
            query += ' AND u.user_id = ?';
            params.push(user_id);
          }
          if (date) {
            query += ' AND cr.reservation_date_time = ?';
            params.push(date);
          }
          break;
        
        case 'session activity':
            query = `
              SELECT 
                al.activity_id,
                al.user_id,
                CONCAT(u.first_name, ' ', u.last_name) AS username,
                u.email,
                al.action,
                al.description,
                al.ip_address,
                al.user_agent,
                al.created_at
              FROM activity_log al
              JOIN user u ON al.user_id = u.user_id
              WHERE 1=1
            `;
          
            // Apply filters if any
            if (user_id) {
              query += ' AND al.user_id = ?';
              params.push(user_id);
            }
            if (date) {
              query += ' AND DATE(al.created_at) = ?';
              params.push(date);
            }
          
            break;
          


      default:
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Invalid specification' }));
        return;
    }

    // Execute the query with the filtered parameters
    connection.query(query, params, (err, results) => {
      if (err) {
        console.error('Error fetching data: ', err);
        res.statusCode = 500;
        res.end('Error fetching data');
        return;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(results));
    });
  });
  return;
}


//                                                     END OF NICKS CODE
































// Backend: RoomReserveTable Route
if (req.method === 'GET' && req.url === '/RoomReserveTable') {
  console.log("RoomReserveTable route hit!");

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No token provided' }));
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid token' }));
      return;
    }

    const userId = decoded.user_ID;

    // Query to filter by user ID and select specific columns
    const query = `
      SELECT 
          reservation_id, 
          user_id, 
          DATE_FORMAT(CONVERT_TZ(reservation_date, '+00:00', @@session.time_zone), '%Y-%m-%d %H:%i:%s') AS reservation_date, 
          reservation_reason, 
          room_number, 
          reservation_duration_hrs, 
          reservation_status, 
          party_size 
        FROM room_reservations 
        WHERE user_id = ?`;

    const params = [userId];

    connection.query(query, params, (err, results) => {
      if (res.headersSent) return;

      if (err) {
        console.error("Database error:", err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Database error' }));
        return;
      }

      if (results.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'No reservations found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    });
  });
}











                                                            //Sahirs Code








///////////////////////////////TESTING NEW BOOK RESERVATION

else if (req.method === 'POST' && req.url.startsWith('/_bookReservation')) {
  const userData = authenticateToken(req, res);
  if(!userData) return;

  try {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const { book_id } = JSON.parse(body);

      if (!book_id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Book ID is required' }));
        return;
      }

      // Query to get the ISBN for the provided book_id
      const getIsbnQuery = `
        SELECT isbn FROM book WHERE book_id = ?
      `;

      connection.query(getIsbnQuery, [book_id], (isbnError, isbnResults) => {
        if (isbnError || isbnResults.length === 0) {
          console.error('Error fetching ISBN:', isbnError);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch ISBN for the book' }));
          return;
        }

        const isbn = isbnResults[0].isbn;

        // Query to find the maximum queue_position for the same ISBN with pending status
        const maxQueueQuery = `
          SELECT MAX(queue_position) AS max_queue
          FROM book_reservations br
          JOIN book b ON br.book_id = b.book_id
          WHERE b.isbn = ? AND br.reservation_status = 'pending'
        `;

        connection.query(maxQueueQuery, [isbn], (maxQueueError, maxQueueResults) => {
          if (maxQueueError) {
            console.error('Error fetching max queue position:', maxQueueError);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to determine queue position' }));
            return;
          }

          // Determine the new queue position
          const maxQueue = maxQueueResults[0].max_queue || 0;
          const newQueuePosition = maxQueue + 1;

          // Insert the new reservation with the calculated queue position
          const reservationStatus = 'pending';
          const dateBorrowed = new Date();
          const dateDue = new Date();
          dateDue.setDate(dateBorrowed.getDate() + 14); // Set due date to 2 weeks from now

          const insertReservationQuery = `
            INSERT INTO book_reservations (book_id, user_id, reservation_status, date_borrowed, date_due, queue_position)
            VALUES (?, ?, ?, ?, ?, ?)
          `;

          connection.query(
            insertReservationQuery,
            [book_id, userData.user_ID, reservationStatus, dateBorrowed, dateDue, newQueuePosition],
            (insertError, insertResults) => {
              if (insertError) {
                console.error('Error inserting reservation:', insertError);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to create book reservation' }));
                return;
              }

              console.log('Reservation successfully created:', insertResults);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  message: 'Book reservation created successfully',
                  queue_position: newQueuePosition,
                })
              );
            }
          );
        });
      });
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'An unexpected error occurred' }));
  }
}


////////////////////END TEST BOOK RESERVATION








// Laptop Entry Route
else if (req.method === 'POST' && req.url === '/_laptopEntry') {
  let body = '';
  req.on('data', (chunk) => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const laptopData = JSON.parse(body);
      const insertLaptopSql = `INSERT INTO Laptops (model_name, serial_number, price) VALUES (?, ?, ?)`;
      const value = [laptopData.model_name, laptopData.serial_number, laptopData.price];

      connection.query(insertLaptopSql, value, (err, result) => {
        if (err) {
          console.error('Error inserting laptop data:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Error inserting laptop data: ${err.message}` }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Laptop added successfully' }));
      });
    } catch (error) {
      console.error('Error processing request:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  });
}

// Fetch laptops (excluding deleted ones)
else if (req.method === 'GET' && req.url === '/_laptopCatalog') {
  const getLaptopsSql = `SELECT model_name, serial_number, price, is_deleted FROM Laptops WHERE is_deleted = 0`; // Exclude deleted laptops

  connection.query(getLaptopsSql, (err, results) => {
    if (err) {
      console.error('Error fetching laptop catalog:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: `Error fetching laptop catalog: ${err.message}` }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results)); // Send the laptop entries as JSON
  });
}

// Flag (soft delete) a laptop
else if (req.method === 'PUT' && req.url === '/_flagLaptop') {
  let body = '';
  req.on('data', (chunk) => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const { serial_number } = JSON.parse(body);
      const flagLaptopSql = `UPDATE Laptops SET is_deleted = 1 WHERE serial_number = ?`;
      
      connection.query(flagLaptopSql, [serial_number], (err, result) => {
        if (err) {
          console.error('Error flagging laptop:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Error flagging laptop: ${err.message}` }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Laptop flagged successfully' }));
      });
    } catch (error) {
      console.error('Error processing request:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  });
}

// Update laptop details (PUT request for editing)
else if (req.method === 'PUT' && req.url === '/_editLaptop') {
  let body = '';
  req.on('data', (chunk) => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const laptopData = JSON.parse(body);

      // Update the laptop with the provided serial_number and model_name, price
      const updateLaptopSql = `
        UPDATE Laptops 
        SET model_name = ?, price = ?, serial_number = ? 
        WHERE serial_number = ? AND is_deleted = 0
      `;
      const values = [
        laptopData.model_name,
        laptopData.price,
        laptopData.serial_number, // this is the new serial number
        laptopData.original_serial_number // this is the original serial number for matching
      ];

      // Assuming you are sending `original_serial_number` to match the current record
      connection.query(updateLaptopSql, values, (err, result) => {
        if (err) {
          console.error('Error updating laptop data:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Error updating laptop data: ${err.message}` }));
          return;
        }

        if (result.affectedRows > 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Laptop updated successfully' }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Laptop not found or already deleted' }));
        }
      });
    } catch (error) {
      console.error('Error processing request:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  });
}

// Calculator Entry Route
if (req.method === 'POST' && req.url === '/_calculatorEntry') {
  let body = '';
  req.on('data', (chunk) => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const calculatorData = JSON.parse(body);
      const insertSql = `INSERT INTO Calculators (calculator_model, calculator_type, calc_serial_num, price) VALUES (?, ?, ?, ?)`;
      const values = [calculatorData.calculator_model, calculatorData.calculator_type, calculatorData.calc_serial_num, calculatorData.price];

      connection.query(insertSql, values, (err, result) => {
        if (err) {
          console.error('Error inserting calculator data:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Error inserting calculator data: ${err.message}` }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Calculator added successfully' }));
      });
    } catch (error) {
      console.error('Error processing request:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  });
}


else if (req.method === 'GET' && req.url === '/_calculatorCatalog') {
  const getCalculatorsSql = `SELECT calculator_model, calculator_type, calc_serial_num, price, is_deleted FROM Calculators WHERE is_deleted = 0`; // Exclude deleted calculators

  connection.query(getCalculatorsSql, (err, results) => {
    if (err) {
      console.error('Error fetching calculator catalog:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: `Error fetching calculator catalog: ${err.message}` }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results)); // Send the calculator entries as JSON
  });
}


else if (req.method === 'PUT' && req.url === '/_flagCalculator') {
  let body = '';
  req.on('data', (chunk) => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const { serial_number } = JSON.parse(body);
      const flagCalculatorSql = `UPDATE Calculators SET is_deleted = 1 WHERE calc_serial_num = ?`;

      connection.query(flagCalculatorSql, [serial_number], (err, result) => {
        if (err) {
          console.error('Error flagging calculator:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Error flagging calculator: ${err.message}` }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Calculator flagged successfully' }));
      });
    } catch (error) {
      console.error('Error processing request:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  });
}

else if (req.method === 'PUT' && req.url === '/_editCalculator') {
  let body = '';
  req.on('data', (chunk) => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const calculatorData = JSON.parse(body);

      // Update the calculator with the provided serial_number, model_name, price, and type
      const updateCalculatorSql = `
        UPDATE Calculators 
        SET calculator_model = ?, price = ?, calc_serial_num = ?, calculator_type = ? 
        WHERE calc_serial_num = ? AND is_deleted = 0
      `;
      const values = [
        calculatorData.calculator_model,     // Corrected field name
        calculatorData.price,
        calculatorData.calc_serial_num,      // Corrected field name
        calculatorData.calculator_type,      // Corrected field name
        calculatorData.original_serial_number // This should match the original serial number for editing
      ];

      // Assuming you are sending `original_serial_number` to match the current record
      connection.query(updateCalculatorSql, values, (err, result) => {
        if (err) {
          console.error('Error updating calculator data:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Error updating calculator data: ${err.message}` }));
          return;
        }

        if (result.affectedRows > 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Calculator updated successfully' }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Calculator not found or already deleted' }));
        }
      });
    } catch (error) {
      console.error('Error processing request:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  });
}

// Laptop Search
else if(req.method === 'GET' && req.url.startsWith('/_laptopSearch')) {
  try {
    // Parse the URL and query parameters
    const urlParts = new URL(req.url, `http://${req.headers.host}`);
    const params = urlParts.searchParams;

    const price = params.get('price');
    const price_comparison = params.get('price_comparison'); // New parameter for price comparison
    const model_name = params.get('model_name');
    const serial_number = params.get('serial_number');

    // Build dynamic SQL query based on provided criteria
    let sql = 'SELECT * FROM Laptops WHERE 1=1';
    const values = [];

    if (price && price_comparison) {
      // Add price comparison condition to SQL query
      sql += ` AND price ${price_comparison} ?`;
      values.push(price);
    } else if (price) {
      // Default price condition (equal to) if no comparison operator is provided
      sql += ' AND price = ?';
      values.push(price);
    }

    if (model_name) {
      sql += ' AND model_name LIKE ?';
      values.push(`%${model_name}%`);
    }

    if (serial_number) {
      sql += ' AND serial_number = ?';
      values.push(serial_number);
    }

    // Execute the search query
    connection.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error searching laptops:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Error searching laptops',
          error: err.message 
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Search completed successfully',
        results: results
      }));
    });
  } catch (error) {
    console.error('Error processing search request:', error);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Invalid search criteria' }));
  }
}

 //Calculator Search
 // Calculator search endpoint
else if (req.method === 'GET' && req.url.startsWith('/_calculatorSearch')) {
  try {
    // Parse the URL and query parameters
    const urlParts = new URL(req.url, `http://${req.headers.host}`);
    const params = urlParts.searchParams;
    
    const price = params.get('price');
    const price_comparison = params.get('price_comparison');
    const model_name = params.get('model_name');
    const serial_number = params.get('serial_number');
    const type = params.get('type');

    // Build dynamic SQL query based on provided criteria
    let sql = 'SELECT * FROM Calculators WHERE 1=1';
    const values = [];

    // Price comparison logic
    if (price && price_comparison) {
      switch (price_comparison) {
        case 'lessThanEqual':
          sql += ' AND price <= ?';
          values.push(price);
          break;
        case 'greaterThanEqual':
          sql += ' AND price >= ?';
          values.push(price);
          break;
        case 'equal':
          sql += ' AND price = ?';
          values.push(price);
          break;
        default:
          break;
      }
    }

    // Other filters
    if (model_name) {
      sql += ' AND calculator_model LIKE ?';
      values.push(`%${model_name}%`);
    }

    if (serial_number) {
      sql += ' AND calc_serial_num = ?';
      values.push(serial_number);
    }

    if (type) {
      sql += ' AND calculator_type LIKE ?';
      values.push(`%${type}%`);
    }

    // Execute the query
    connection.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error searching calculators:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Error searching calculators', error: err.message }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Search completed successfully', results }));
    });
  } catch (error) {
    console.error('Error processing search request:', error);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Invalid search criteria' }));
  }
}

//Laptop Reservation Route
// Laptop Reservation Handler
else if(req.method === 'POST' && req.url === '/_laptopReservation'){
  const userData = authenticateToken(req, res);
  if (!userData) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Authentication failed' }));
    return;
  }

  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const { laptopId, reservationDateTime, duration } = data;

      // Fetch laptop details
      const getLaptopDetailsSql = `
        SELECT model_name, serial_number, price, laptop_status 
        FROM Laptops 
        WHERE laptop_ID = ? AND laptop_status = 0`;
      
      connection.query(getLaptopDetailsSql, [laptopId], (err, results) => {
        if (err) {
          console.error('Error fetching laptop details: ', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            success: false, 
            message: 'Error fetching laptop details' 
          }));
          return;
        }

        if (results.length === 0) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            success: false, 
            message: 'Laptop is not available' 
          }));
          return;
        }

        const { model_name, serial_number } = results[0];

        // Check for reservation conflicts
        const checkReservationSql = `
          SELECT * FROM laptop_reservations 
          WHERE laptop_ID = ? 
          AND reservation_date_time <= ? 
          AND (reservation_date_time + INTERVAL reservation_range_hrs HOUR) > ?
          AND reservation_status = 'ongoing'`;

        const reservationEndTime = new Date(reservationDateTime);
        reservationEndTime.setHours(reservationEndTime.getHours() + parseInt(duration));

        connection.query(checkReservationSql, [laptopId, reservationDateTime, reservationEndTime], (err, reservedResults) => {
          if (err) {
            console.error('Error checking reservation: ', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              success: false, 
              message: 'Error checking reservation availability' 
            }));
            return;
          }

          if (reservedResults.length > 0) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              success: false, 
              message: 'Laptop is already reserved for the selected time' 
            }));
            return;
          }

          // Insert reservation
          const insertReservationSql = `
            INSERT INTO laptop_reservations (
              user_id,
              laptop_ID,
              reservation_date_time,
              reservation_range_hrs,
              reservation_status,
              model_name
            ) VALUES (?, ?, ?, ?, ?, ?)`;

          const values = [
            userData.user_ID,
            laptopId,
            reservationDateTime,
            duration,
            'pending',
            model_name
          ];

          connection.query(insertReservationSql, values, (err, result) => {
            if (err) {
              console.error('Error inserting reservation: ', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: false, 
                message: 'Error making reservation' 
              }));
              return;
            }

            // Update laptop status
            const updateLaptopStatusSql = 'UPDATE Laptops SET laptop_status = 1 WHERE laptop_ID = ?';
            connection.query(updateLaptopStatusSql, [laptopId], (err, result) => {
              if (err) {
                console.error('Error updating laptop status: ', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: false, 
                  message: 'Error updating laptop status' 
                }));
                return;
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                message: 'Laptop reserved successfully',
                reservationId: result.insertId
              }));
            });
          });
        });
      });
    } catch (error) {
      console.error('Error parsing request body:', error);
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        success: false, 
        message: 'Invalid request format' 
      }));
    }
  });
}
// Fetch available laptops
else if (req.method === 'GET' && req.url.startsWith('/get-laptops')) {
  // Base SQL query to get available laptops with relevant details
  const sql = `
    SELECT 
      laptop_ID,
      model_name,
      serial_number,
      price,
      processor,
      memory,
      storage,
      battery_life,
      camera,
      USB_ports,
      display_ports,
      resolution
    FROM Laptops 
    WHERE laptop_status = 0 
    AND is_deleted = 0`;  // Only get available and non-deleted laptops

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching laptops: ', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Error fetching laptops' }));
      }
      return;
    }

    if (!res.headersSent) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        data: results,
        count: results.length
      }));
    }
  });
  return;
}

// Calculator Reservation
// Calculator Reservation
else if(req.method === 'POST' && req.url === '/_calculatorReservation'){
  const userData = authenticateToken(req, res);
  if (!userData) return;

  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const data = JSON.parse(body);
    const { calculatorId, reservationDateTime, duration, reservationReason, calculatorType } = data;

    // First, fetch the details of the calculator being reserved
    const getCalculatorDetailsSql = 'SELECT calculator_model, calculator_type, calc_serial_num, price, calculator_status FROM Calculators WHERE calculator_id = ? AND calculator_status = 0';
    connection.query(getCalculatorDetailsSql, [calculatorId], (err, results) => {
      if (err) {
        console.error('Error fetching calculator details: ', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Error fetching calculator details');
        }
        return;
      }

      if (results.length === 0) {
        if (!res.headersSent) {
          res.statusCode = 400;
          res.end('Calculator is not available');
        }
        return;
      }

      const { calculator_model, calculator_type, calculator_serial_num, price, calculator_status } = results[0];

      // Ensure the selected calculator type matches the one in the database
      if (calculatorType !== calculator_type) {
        if (!res.headersSent) {
          res.statusCode = 400;
          res.end('Selected calculator type does not match the available type');
        }
        return;
      }

      // Check if the calculator is already reserved during the requested time
      const checkReservationSql = 'SELECT * FROM calculator_reservations WHERE calculator_id = ? AND reservation_date_time <= ? AND (reservation_date_time + INTERVAL reservation_range_hrs HOUR) > ? AND reservation_status = "ongoing"';
      const reservationEndTime = new Date(reservationDateTime);
      reservationEndTime.setHours(reservationEndTime.getHours() + duration); // Calculate end time based on duration

      connection.query(checkReservationSql, [calculatorId, reservationDateTime, reservationEndTime], (err, reservedResults) => {
        if (err) {
          console.error('Error checking reservation: ', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end('Error checking reservation availability');
          }
          return;
        }

        if (reservedResults.length > 0) {
          if (!res.headersSent) {
            res.statusCode = 400;
            res.end('Calculator is already reserved for the selected time');
          }
          return;
        }

        // Insert reservation into calculator_reservations table
        const insertReservationSql = `
          INSERT INTO calculator_reservations (user_id, calculator_id, reservation_date_time, reservation_range_hrs, reservation_status, calc_type, model_name)
          VALUES (?, ?, ?, ?, ?, ?, ?)`;

        const values = [
          userData.user_ID,
          calculatorId,
          reservationDateTime,
          duration,
          'reserved',  // Reservation status is reserved when first made
          calculator_type,
          calculator_model
        ];

        connection.query(insertReservationSql, values, (err, result) => {
          if (err) {
            console.error('Error inserting reservation: ', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end('Error making reservation');
            }
            return;
          }

          // Update the calculator status from available (0) to reserved (1)
          const updateCalculatorStatusSql = 'UPDATE Calculators SET calculator_status = 1 WHERE calculator_id = ?';
          connection.query(updateCalculatorStatusSql, [calculatorId], (err, result) => {
            if (err) {
              console.error('Error updating calculator status: ', err);
              if (!res.headersSent) {
                res.statusCode = 500;
                res.end('Error updating calculator status');
              }
              return;
            }

            if (!res.headersSent) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ message: 'Calculator reserved successfully' }));
            }
          });
        });
      });
    });
  });
  return;
}

//fetch available calculators
else if (req.method === 'GET' && req.url.startsWith('/get-calculators')) {
  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const calculatorType = urlParams.get('type');  // Get the calculator type (either 'Graphing' or 'Scientific')

  // Adjust SQL query based on the selected type
  let sql = 'SELECT calculator_id, calculator_model, calculator_type FROM Calculators WHERE calculator_status = 0';

  if (calculatorType) {
    sql += ' AND calculator_type = ?';
  }

  connection.query(sql, [calculatorType], (err, results) => {
    if (err) {
      console.error('Error fetching calculators: ', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Error fetching calculators');
      }
      return;
    }

    if (!res.headersSent) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(results));
    }
  });
  return;
}

// Cancel Calculator Reservation
// Backend route handler:
else if (req.method === 'POST' && req.url === '/cancel-cal-reservation') {
  console.log("Reached /cancel-cal-reservation route");
  
  const userData = authenticateToken(req, res);
  if (!userData) return;

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const data = JSON.parse(body);
    const { reservationId, calculatorId } = data;

    // Begin transaction
    connection.beginTransaction(err => {
      if (err) {
        console.error('Error starting transaction:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
        return;
      }

      // Check if the reservation exists and is not already cancelled or fulfilled
      const checkReservationSql = `
        SELECT reservation_status 
        FROM calculator_reservations 
        WHERE reservation_id = ? AND user_id = ?`;

      connection.query(checkReservationSql, [reservationId, userData.user_ID], (err, result) => {
        if (err) {
          return connection.rollback(() => {
            console.error('Error checking reservation status:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Error checking reservation status' }));
          });
        }

        if (result.length === 0) {
          return connection.rollback(() => {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Reservation not found' }));
          });
        }

        const reservationStatus = result[0].reservation_status;
        if (reservationStatus === 'cancelled' || reservationStatus === 'fulfilled') {
          return connection.rollback(() => {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Reservation is already cancelled or fulfilled' }));
          });
        }

        // Proceed with the cancellation
        const updateReservationSql = `
          UPDATE calculator_reservations 
          SET reservation_status = 'cancelled' 
          WHERE reservation_id = ? AND user_id = ?`;

        connection.query(updateReservationSql, [reservationId, userData.user_ID], (err, result) => {
          if (err) {
            return connection.rollback(() => {
              console.error('Error updating reservation:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Error canceling reservation' }));
            });
          }

          // Then update calculator status
          const updateCalculatorSql = `
            UPDATE Calculators 
            SET calculator_status = 0 
            WHERE calculator_id = ?`;

          connection.query(updateCalculatorSql, [calculatorId], (err, result) => {
            if (err) {
              return connection.rollback(() => {
                console.error('Error updating calculator status:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Error updating calculator status' }));
              });
            }

            // Commit the transaction
            connection.commit(err => {
              if (err) {
                return connection.rollback(() => {
                  console.error('Error committing transaction:', err);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Error completing cancellation' }));
                });
              }

              // Success response
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ message: 'Reservation canceled successfully' }));
            });
          });
        });
      });
    });
  });
  return;
}

// Cancel Laptop Route
else if (req.method === 'POST' && req.url === '/cancel-laptop-reservation') {
  const userData = authenticateToken(req, res);
  if (!userData) return;

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const data = JSON.parse(body);
    const { reservationId, laptopId } = data;

    // Begin transaction
    connection.beginTransaction(err => {
      if (err) {
        console.error('Error starting transaction:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
        return;
      }

      // Check if the reservation exists and is not already cancelled or fulfilled
      const checkReservationSql = `
        SELECT reservation_status 
        FROM laptop_reservations 
        WHERE reservation_id = ? AND user_id = ?`;

      connection.query(checkReservationSql, [reservationId, userData.user_ID], (err, result) => {
        if (err) {
          return connection.rollback(() => {
            console.error('Error checking reservation status:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Error checking reservation status' }));
          });
        }

        if (result.length === 0) {
          return connection.rollback(() => {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Reservation not found' }));
          });
        }

        const reservationStatus = result[0].reservation_status;
        if (reservationStatus === 'cancelled' || reservationStatus === 'fulfilled') {
          return connection.rollback(() => {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Reservation is already cancelled or fulfilled' }));
          });
        }

        // Proceed with the cancellation
        const updateReservationSql = `
          UPDATE laptop_reservations 
          SET reservation_status = 'cancelled' 
          WHERE reservation_id = ? AND user_id = ?`;

        connection.query(updateReservationSql, [reservationId, userData.user_ID], (err, result) => {
          if (err) {
            return connection.rollback(() => {
              console.error('Error updating reservation:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Error canceling reservation' }));
            });
          }

          // Then update laptop status
          const updateLaptopSql = `
            UPDATE Laptops 
            SET laptop_status = 0 
            WHERE laptop_id = ?`;

          connection.query(updateLaptopSql, [laptopId], (err, result) => {
            if (err) {
              return connection.rollback(() => {
                console.error('Error updating laptop status:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Error updating laptop status' }));
              });
            }

            // Commit the transaction
            connection.commit(err => {
              if (err) {
                return connection.rollback(() => {
                  console.error('Error committing transaction:', err);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Error completing cancellation' }));
                });
              }

              // Success response
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ message: 'Reservation canceled successfully' }));
            });
          });
        });
      });
    });
  });
  return;
}





















//Justins Code


// Route for sending "book ready" notification email
if (req.method === 'POST' && req.url === '/send-book-ready-email') {
  const userData = authenticateToken(req, res); // Extract user details from token if needed
  if (!userData) return;

  let body = '';
  req.on('data', (chunk) => { body += chunk.toString(); });

  req.on('end', async () => {
    try {
      const { userId, bookId } = JSON.parse(body);
      if (!userId || !bookId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Missing user or book details' }));
        return;
      }

      // Query to get user's email and book title from the database
      const userQuery = `SELECT email FROM users WHERE user_id = ?`;
      const bookQuery = `SELECT title FROM book WHERE book_id = ?`;

      connection.query(userQuery, [userId], async (userErr, userResults) => {
        if (userErr || userResults.length === 0) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'User not found or database error' }));
          return;
        }

        const userEmail = userResults[0].email;

        connection.query(bookQuery, [bookId], async (bookErr, bookResults) => {
          if (bookErr || bookResults.length === 0) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Book not found or database error' }));
            return;
          }

          const bookTitle = bookResults[0].title;

          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: 'hendrixjustin908@gmail.com',
              pass: 'lblh rxzb hyxz fwai',
            }
          });

          const mailOptions = {
            from: 'hendrixjustin908@gmail.com',
            to: userEmail,
            subject: 'Your Reserved Book is Ready for Pickup!',
            text: `Hello! The book "${bookTitle}" is now available for pickup.`
          };

          try {
            await transporter.sendMail(mailOptions);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Book ready email sent successfully' }));
          } catch (emailError) {
            console.error('Error sending book ready email:', emailError);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Failed to send book ready email', error: emailError.message }));
          }
        });
      });
    } catch (error) {
      console.error('Error processing request data:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  });
}




















// Endpoint to update reservation status
if (req.method === 'POST' && req.url === '/update-reservation-status') {
  let body = '';
  req.on('data', (chunk) => { body += chunk.toString(); });
  
  req.on('end', async () => {
    try {
      const { reservationId, status } = JSON.parse(body);
      const userData = authenticateToken(req, res);
      if (!userData) return;

      // Update reservation status in MySQL
      const updateQuery = 'UPDATE laptop_reservations SET reservation_status = ? WHERE reservation_id = ?';
      connection.query(updateQuery, [status, reservationId], (error, result) => {
        if (error) {
          console.error('Error updating reservation status:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Failed to update reservation status' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Reservation status updated successfully' }));
      });
    } catch (error) {
      console.error('Invalid request data:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  });
}





// Handle POST request to add a new staff member
if (req.method === 'POST' && req.url === '/staff') {
  let body = '';

  // Collect data from the request body
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      // Parse the JSON body
      const { first_name, last_name, email, phone_number, position, status, salary, notes } = JSON.parse(body);

      // Basic validation
      if (!first_name || !last_name || !email || !phone_number || !position || !status || salary == null) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Please provide all required fields' }));
        return;
      }

      // Insert the new staff member into the database
      const query = `
        INSERT INTO staff (first_name, last_name, email, phone_number, position, status, salary, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [first_name, last_name, email, phone_number, position, status, salary, notes];

      connection.query(query, params, (err, result) => {
        if (err) {
          console.error('Database error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Database error', error: err.message }));
          return;
        }

        // Check if the insertion was successful
        if (result.affectedRows > 0) {
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Staff member added successfully' }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Failed to add staff member' }));
        }
      });
    } catch (error) {
      console.error('Error parsing or inserting data:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Server error', error: error.message }));
    }
  });
}





// Route for sending overdue email (authenticated)
if (req.method === 'POST' && req.url === '/send-overdue-email') {
  const userData = authenticateToken(req, res); // Extract email from token
  if (!userData) return;

  let body = '';
  req.on('data', (chunk) => { body += chunk.toString(); });

  req.on('end', async () => {
    try {
      const { reservation_id, overdueDays, amount_due } = JSON.parse(body); // Get `overdueDays` and `amount_due` directly from frontend
      console.log("Received data on backend:", { reservation_id, overdueDays, amount_due });
      // Validate the request body
      if (!reservation_id || overdueDays == null || amount_due == null) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Missing reservation details' }));
        return;
      }

      // Check `send_overdue_email` in the database
      const query = `SELECT send_overdue_email FROM laptop_reservations WHERE reservation_id = ?`;
      
      connection.query(query, [reservation_id], async (err, results) => {
        if (err) {
          console.error('Database error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Database error fetching reservation details' }));
          return;
        }
        
        if (results.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Reservation not found' }));
          return;
        }

        const { send_overdue_email } = results[0];

        // Only send an email if `send_overdue_email` is set to 1
        if (send_overdue_email === 1) {
          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: 'hendrixjustin908@gmail.com',
              pass: 'lblh rxzb hyxz fwai',
            }
          });

          const mailOptions = {
            from: 'hendrixjustin908@gmail.com',
            to: userData.email, // Get email directly from the authenticated user data
            subject: 'Your Laptop Reservation is Overdue!',
            text: `Your reservation with ID ${reservation_id} is overdue by ${overdueDays} days. The total amount due is $${amount_due}.`
          };

          try {
            await transporter.sendMail(mailOptions);

            // Update `send_overdue_email` to 0 after successful email
            const updateQuery = `UPDATE laptop_reservations SET send_overdue_email = 0 WHERE reservation_id = ?`;
            connection.query(updateQuery, [reservation_id], (updateErr) => {
              if (updateErr) {
                console.error('Error resetting send_overdue_email flag:', updateErr);
              } else {
                console.log(`send_overdue_email flag reset for reservation ID: ${reservation_id}`);
              }
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Overdue email sent successfully' }));
          } catch (emailError) {
            console.error('Error sending overdue email:', emailError);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Failed to send overdue email', error: emailError.message }));
          }
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'No email sent - send_overdue_email flag is not set' }));
        }
      });
    } catch (error) {
      console.error('Error processing request data:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  });
  return;
}

// GET /booktable_reservations - Fetch all reservations
if (req.method === 'GET' && req.url === '/booktable_reservations') {
  try {
    const reservations = await queryDatabase(
      `SELECT reservation_id, book_id, user_id, reservation_date_time, reservation_status, 
              book_title, book_author, date_borrowed, date_due, date_returned
       FROM book_reservations`
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(reservations));
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to fetch reservations' }));
  }
}

// POST /cancel-reservation - Cancel a reservation by ID
else if (req.method === 'POST' && req.url === '/cancel-reservation') {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });
  req.on('end', async () => {
    try {
      const { reservationId } = JSON.parse(body);

      // Update reservation status to "Canceled"
      await queryDatabase(
        `UPDATE book_reservations SET reservation_status = 'Canceled' WHERE reservation_id = ?`,
        [reservationId]
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Reservation canceled successfully' }));
    } catch (error) {
      console.error('Error canceling reservation:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to cancel reservation' }));
    }
  });
}




  



//Logout Stuff
else if (req.method === 'POST' && req.url === '/logout') {
  // Authenticate the token to get the user details
  const user = authenticateToken(req, res); // Use the same authenticateToken middleware
  
  if (!user) {
    // If token is invalid or expired, the authenticateToken middleware will already send a response
    return;
  }

  try {
    // Log the logout activity
    const ip_address = req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];

    // Insert logout activity into activity_log
    const logQuery = `INSERT INTO activity_log (user_id, action, description, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, NOW())`;
    const logValues = [user.user_ID, 'logout', 'User logged out', ip_address, user_agent];

    connection.query(logQuery, logValues, (logErr, logResult) => {
      if (logErr) {
        console.error('Error logging activity:', logErr);
      } else {
        console.log('User logout activity logged successfully');
      }
    });

    // Send a response indicating successful logout
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Logout successful' }));

  } catch (error) {
    console.error('Error logging out:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Error logging out' }));
  }
}


 // Laptop Reservations Table Route
 if (req.method === 'GET' && req.url === '/laptop_reservations') {
  try {
    console.log('Attempting to fetch laptop reservations...');
    
    const query = `SELECT reservation_id, laptop_id, user_id, reservation_date_time, reservation_status FROM laptop_reservations`;
    
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error fetching laptop reservations:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to retrieve laptop reservations' }));
        return;
      }
      
      console.log('Query executed successfully, results:', results);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'An unexpected error occurred' }));
  }
}
 // Calculator Reservations Table  Route
 if (req.method === 'GET' && req.url === '/calculator_reservations') {
  try {
    console.log('Attempting to fetch laptop reservations...');
    
    const query = `SELECT reservation_id, calculator_id, user_id, calc_type, model_name, reservation_date_time, reservation_status  FROM calculator_reservations`;
    
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error fetching laptop reservations:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to retrieve laptop reservations' }));
        return;
      }
      
      console.log('Query executed successfully, results:', results);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'An unexpected error occurred' }));
  }
}

  // soft Delete Profile Route
  else if (req.method === 'DELETE' && req.url === '/DeleteProfile') {
    console.log('Soft delete profile route hit!');

    // Authenticate the user
    const decoded = authenticateToken(req, res);
    if (!decoded) return;

    const userEmail = decoded.email; // Assuming the token includes the user's email

    // Perform a soft delete by setting is_deleted to true for the user's profile
    const softDeleteQuery = 'UPDATE user SET is_deleted = TRUE WHERE email = ?';
    connection.query(softDeleteQuery, [userEmail], (err, result) => {
      if (err) {
        console.error('Error performing soft delete:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to delete profile' }));
        return;
      }

      if (result.affectedRows === 0) {
        // No rows affected, meaning the user was not found
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User not found' }));
      } else {
        // Profile soft deletion successful
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Profile marked as deleted successfully' }));
      }
    });
  }






 // Update Profile Route
else if (req.method === 'PUT' && req.url === '/ProfilePage2') {
  console.log("Update Profile route hit!"); // Confirm route is reached
  const decoded = authenticateToken(req, res);
  if (!decoded) return;

  try {
    const { first_name, last_name } = await getRequestData(req); // Get request data

    // Log the incoming data to ensure it was captured correctly
    console.log("Received data for update:", { first_name, last_name });

    if (!first_name || !last_name) {
      if (!res.headersSent) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Missing required fields' }));
      }
      return;
    }

    // Perform the update query
    const updateQuery = 'UPDATE user SET first_name = ?, last_name = ? WHERE email = ?';
    connection.query(updateQuery, [first_name, last_name, decoded.email], (err, result) => {
      if (err) {
        console.error('Database update error:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Database error during profile update' }));
        }
        return;
      }

      console.log("Update query executed, affected rows:", result.affectedRows);

      // Check if any rows were updated
      if (result.affectedRows === 0) {
        if (!res.headersSent) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'User not found or data is the same as before' }));
        }
        return;
      }

      // Send the updated profile data back
      const selectQuery = 'SELECT user_ID, first_name, last_name, email FROM user WHERE email = ?';
      connection.query(selectQuery, [decoded.email], (err, results) => {
        if (err) {
          console.error('Database retrieval error:', err);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Database error after profile update' }));
          }
          return;
        }

        console.log("Query Results after update:", results); // Log results

        if (results.length === 0) {
          if (!res.headersSent) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User not found after update' }));
          }
        } else {
          if (!res.headersSent) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results[0])); // Send the updated profile data
          }
        }
      });
    });
  } catch (error) {
    console.error('Error processing request data:', error);
    if (!res.headersSent) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  }
}

  // SignUp Route
  if (req.method === 'POST' && req.url === '/SignUp') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const user = JSON.parse(body);

        if (!user.first_name || !user.last_name || !user.email || !user.password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Missing required fields' }));
          return;
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Check if the email exists in the staff or teacher tables
        const staffCheckQuery = 'SELECT * FROM staff WHERE email = ?';
        const teacherCheckQuery = 'SELECT * FROM teacher WHERE email = ?';

        // First, check the staff table
        connection.query(staffCheckQuery, [user.email], (err, staffResults) => {
          if (err) {
            console.error('Error querying staff table:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Database query error' }));
            return;
          }

          let position = 'Student'; // Default position for users

          if (staffResults.length > 0) {
            // If a match is found in the staff table, set the position to "Staff"
            position = 'Staff';
          }

          // Now check the teacher table
          connection.query(teacherCheckQuery, [user.email], (err, teacherResults) => {
            if (err) {
              console.error('Error querying teacher table:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'Database query error' }));
              return;
            }

            if (teacherResults.length > 0) {
              // If a match is found in the teacher table, set the position to "Teacher"
              position = 'Teacher';
            }

            // Now that we've checked both tables, insert the user with the correct position
            const insertSql = `
              INSERT INTO user (first_name, last_name, email, password, user_level)
              VALUES (?, ?, ?, ?, ?)
            `;
            
            const values = [user.first_name, user.last_name, user.email, hashedPassword, position];

            connection.query(insertSql, values, (err, result) => {
              if (err) {
                console.error('Error inserting user data:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: `Error inserting user data: ${err.message}` }));
                return;
              }
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'User Information Added Successfully' }));
            });
          });
        });
      } catch (error) {
        console.error('Error Processing Request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid Request Data' }));
      }
    });
  }

// SignIn Route
else if (req.method === 'POST' && req.url === '/SignIn') {
  try {
    const { email, password } = await getRequestData(req);

    // Log the email and password received from the request
    console.log("Login attempt:", email, password);

    if (!email || !password) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Missing email or password' }));
      return;
    }

    // Query the database for the user by email
    connection.query('SELECT * FROM user WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Database query error:', err); // Log database query errors
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Database query error' }));
        return;
      }

      if (results.length === 0) {
        console.log('No user found with this email'); // Log no user found case
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid email or password' }));
        return;
      }

      const user = results[0];

      // Check if the user's account is marked as deleted
      if (user.is_deleted) {
        console.log('Account is deactivated'); // Log if account is deactivated
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Account is deactivated. Please contact support.' }));
        return;
      }

      // Compare the entered password with the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        console.log('Password mismatch'); // Log if the password doesn't match
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid email or password' }));
        return;
      }

      // Generate JWT token
      try {
        const token = jwt.sign({ user_ID: user.user_ID, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        // Log successful login
        console.log('Login successful, JWT token created');

        // Capture IP address and user agent
        const ip_address = req.connection.remoteAddress;
        const user_agent = req.headers['user-agent'];

        // Insert login activity into activity_log
        const logQuery = `INSERT INTO activity_log (user_id, action, description, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, NOW())`;
        const logValues = [user.user_ID, 'login', 'User logged in', ip_address, user_agent];

        connection.query(logQuery, logValues, (logErr, logResult) => {
          if (logErr) {
            console.error('Error logging activity:', logErr);
          } else {
            console.log('User login activity logged successfully');
          }
        });

        // Return the token on successful login
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Login successful', token }));
      } catch (tokenError) {
        console.error('JWT token generation error:', tokenError); // Log any token generation errors

        // Ensure headers are only sent if not previously sent
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Error generating token' }));
        }
      }
    });

  } catch (error) {
    console.error('Request data processing error:', error); // Log any errors in processing request data

    // Ensure headers are only sent if not previously sent
    if (!res.headersSent) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  }
}


   // ProfilePage2 Route (JWT-protected)
   else if (req.method === 'GET' && req.url === '/ProfilePage2') {
    console.log("ProfilePage2 route hit!"); // Add this log
    const decoded = authenticateToken(req, res);
    if (!decoded) return;

    console.log("Decoded token:", decoded); // Log the decoded token

    const query = 'SELECT user_ID, first_name, last_name, email, user_level FROM user WHERE email = ?';
    connection.query(query, [decoded.email], (err, results) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Database error' }));
        return;
      }

      console.log("Query Results:", results); // Log the query results

      if (results.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'User not found' }));
      } else {
        console.log("Returning User Data:", results[0]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results[0])); // Return the user's profile details
      }
    });
  }

/*
  // Default route
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Route not found' }));
}
    */
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
