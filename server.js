const http = require('http');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { parse } = require('querystring');
const { URL } = require('url');


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



  //search across books, audio and ebooks, and periodicals
  if (req.method === 'GET' && req.url.startsWith('/search')) {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const term = urlParams.get('term');
    
    if (!term) {
      res.end(JSON.stringify({ error: 'term query parameter is required' }));
      return;
    }
  const sql = `
    SELECT *, 
    CASE 
        WHEN source = 'book' THEN 2
        WHEN source = 'audiobook' THEN 1
        WHEN source = 'ebook' THEN 1
        WHEN source = 'periodical' THEN 0.5
        ELSE 0.5
    END AS relevance 
    FROM (
      SELECT book_id AS id, book_title AS title, author, 'book' AS source
      FROM book 
      WHERE MATCH (isbn, book_title, author) AGAINST (? IN NATURAL LANGUAGE MODE)
      
      UNION ALL

      SELECT audiobook_id AS id, audio_title AS title, audio_author AS author, 'audiobook' AS source
      FROM audiobook
      WHERE MATCH (audio_isbn, audio_title, audio_author) AGAINST (? IN NATURAL LANGUAGE MODE)

      UNION ALL

      SELECT ebook_id AS id, ebook_title AS title, ebook_author AS author, 'ebook' AS source
      FROM ebook
      WHERE MATCH (ebook_isbn, ebook_title, ebook_author) AGAINST (? IN NATURAL LANGUAGE MODE)

      UNION ALL

      SELECT periodical_id AS id, periodical_title AS title, periodical_author AS author, 'periodical' AS source
      FROM periodical
      WHERE MATCH (periodical_issn, periodical_title, periodical_author) AGAINST (? IN NATURAL LANGUAGE MODE)
    ) AS combined 
    ORDER BY relevance DESC;
    `;
  const likeTerm = `${term}%`; // Use wildcards for LIKE
  
  console.log('Executing query:', sql, 'with parameters:', [`${term}%`]);
  connection.query(sql, [term, term, term, term, term, term, term, term], (error, results) => {
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

    const sql = 'SELECT * FROM book WHERE book_id = ?';
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
        bNumPages, bLang, bSummary, bNotes } = bookEntryData
      
    //would check for existing book. is this necessary tho
    //const checkSql = 'SELECT * FROM books WHERE isbn = ?';
      const insertSql = 
      'INSERT INTO book (isbn, author, book_title, book_category, year_copyright, edition, availability, media_type, publisher, num_pages, language, book_summary, book_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      
      connection.query(insertSql, [bIsbn, bAuthor, bTitle, bCategory,
        bYear, bEdition, bNumCopies, bMediaType, bPublisher, bNumPages, bLang, 
        bSummary, bNotes], (err, result) => {
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

  //send audiobook data to server
  if(req.method === 'POST' && req.url === '/catalog-entry/audiobook') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString(); //convert buffer to string
    });
    req.on('end', () => {

        const abookEntryData = JSON.parse(body);
        const { abIsbn, abTitle, abAuthor, abNarrator,abPublisher, 
          abCategory, abEdition, abLanguage, abDate, abDuration,  abFormat,  
          abSummary, abNotes } = abookEntryData
        
      //would check for existing book. is this necessary tho
      //const checkSql = 'SELECT * FROM books WHERE isbn = ?';
        const insertSql = 
        'INSERT INTO audiobook (audio_isbn, audio_title, audio_author, audio_narrator, audio_publisher, audio_category, audio_edition, audio_language, date_published, duration, format, availability, audio_summary, audio_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        
        connection.query(insertSql, [abIsbn, abTitle, abAuthor, abNarrator,abPublisher, 
          abCategory, abEdition, abLanguage, abDate, abDuration,  abFormat, 1,  
          abSummary, abNotes], (err, result) => {
          if (err) {
            console.error('Error inserting audiobook data: ', err);
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






























                                                  //Nicks Code

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
      const { roomId, partySize, reservationDateTime, duration } = data;

      const insertReservationSql = `
        INSERT INTO room_reservations (user_id, room_number, reservation_date, reservation_duration_hrs, party_size, reservation_status)
        VALUES (?, ?, ?, ?, ?, ?)`;

        const values = [userData.user_ID, roomId, reservationDateTime, duration, partySize, 'ongoing'];

      //status should be set to ongoing. if reservation is canceled thru user profile or reservation has ended, status must change
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
      const { bookName, bookAuthor, rating, comments, type } = data;

      if (!bookName || !bookAuthor || !rating) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Missing required feedback fields' }));
        return;
      }

      // Insert feedback into the database
      const insertFeedbackSql = `
        INSERT INTO feedback (user_id, book_name, book_author, rating, description, type)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const values = [userData.user_ID, bookName, bookAuthor, rating, comments || null, type || 'general'];

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
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  });
  return;
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



































  //JUSTINS CODE
   // RoomReserveTable Route (temporarily without authenticateToken)
  if (req.method === 'GET' && req.url === '/RoomReserveTable') {
    console.log("RoomReserveTable route hit!");

    const query = 'SELECT reservation_id, user_id, reservation_date, room_number, reservation_duration_hrs, party_size FROM room_reservations';
    connection.query(query, (err, results) => {
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
    return; // Ensure no further code runs in this route
  }










                                                            //Sahirs Code




 // Calculator Entry Route
 if (req.method === 'POST' && req.url === '/_calculatorEntry') {
  let body = '';
  req.on('data', (chunk) => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const calculatorData = JSON.parse(body);
      const insertSql = `INSERT INTO Calculators (calculator_model, calculator_type, calc_serial_num, price) VALUES (?, ?, ?, ?)`;
      const values = [calculatorData.model_name, calculatorData.type, calculatorData.serial_number, calculatorData.price];

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

 // Book Reservation Route
 else if (req.method === 'POST' && req.url === '/_bookReservation') {

  const userData = authenticateToken(req, res);
  if(!userData) return;

  let body = '';
  req.on('data', (chunk) => { body += chunk.toString(); });
  req.on('end', async () => {
    try {
      const data = JSON.parse(body);
      const { reservation_date_time, book_id, book_title, book_author, reservation_type } = data;

      if (!reservation_date_time || !book_title || !book_author || !reservation_type) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'All fields are required' }));
        return;
      }

      const checkDuplicateSql = `SELECT * FROM book_reservations WHERE book_title = ? AND book_author = ? AND reservation_date_time = ?`;
      connection.query(checkDuplicateSql, [book_title, book_author, reservation_date_time], (err, results) => {
        if (err) {
          console.error('Error checking duplicates:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Error checking reservation availability' }));
          return;
        }

        if (results.length > 0) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'This book is already reserved for the selected date' }));
          return;
        }

        const reservation_status = 'pending';
        const insertBookSql = `INSERT INTO book_reservations (book_id, user_id, reservation_date_time, book_title, book_author, reservation_type, reservation_status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const values = [book_id, userData.user_ID, reservation_date_time, book_title, book_author, reservation_type, reservation_status];

        connection.query(insertBookSql, values, (err, result) => {
          if (err) {
            console.error('Error inserting reservation:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Error creating reservation' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Reservation created successfully', reservation_id: result.insertId }));
        });
      });
    } catch (error) {
      console.error('Error processing reservation request:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  });
}




// create a laptop reservation
else if(req.method === 'POST' && req.url === '/_laptopReservation'){
  const userData = authenticateToken(req, res);
  if(!userData) return;
  
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
    const data = JSON.parse(body);
    const { reservation_date_time } = data;

    if (!reservation_date_time) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'All fields are required' }));
      return;
    }

 //   const reservation_status = 'pending';

    const insertBookSql = `INSERT INTO laptop_reservations (user_id, reservation_date_time) VALUES (?, ?)`;
    
    const values = [userData.user_ID, 
      reservation_date_time,
    ];
    connection.query(insertBookSql, values, (err, result) => {
      if (err) {
        console.error('Error inserting reservation:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Error creating reservation',
          error: err.message 
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Reservation created successfully',
        reservation_id: result.insertId
      }));
    });
  } catch(error){
    console.error('Error processing reservation request:', error);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Invalid request data' }));
  }
  });
}

// Calculator Reservation
else if(req.method === 'POST' && req.url === '/_calculatorReservation'){
  const userData = authenticateToken(req,res);
  if(!userData) return;


  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
    const data = JSON.parse(body);
    const { reservation_date_time, calc_type } = data;

    if (!reservation_date_time || !calc_type) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'All fields are required' }));
      return;
    }

 //   const reservation_status = 'pending';

    const insertBookSql = `INSERT INTO calculator_reservations (user_id, reservation_date_time, calc_type) VALUES (?, ?, ?)`;
    
    const values = [userData.user_ID,
      reservation_date_time, calc_type
    ];
    connection.query(insertBookSql, values, (err, result) => {
      if (err) {
        console.error('Error inserting reservation:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Error creating reservation',
          error: err.message 
        }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Reservation created successfully',
        reservation_id: result.insertId
      }));
    });
  } catch(error){
    console.error('Error processing reservation request:', error);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Invalid request data' }));
  }
  });
}

// in the meantime, do laptop search at least
else if(req.method === 'GET' && req.url.startsWith('/_laptopSearch')){
  try{
     // Parse the URL and query parameters
     const urlParts = new URL(req.url, `http://${req.headers.host}`);
     const params = urlParts.searchParams;
     
     const price = params.get('price');
     const model_name = params.get('model_name');
     const serial_number = params.get('serial_number');
 
     // Build dynamic SQL query based on provided criteria
     let sql = 'SELECT * FROM Laptops WHERE 1=1';
     const values = [];
 
     if (price) {
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
   } catch(error){
    console.error('Error processing search request:', error);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Invalid search criteria' }));
   }
}

// Calculator search
else if(req.method === 'GET' && req.url.startsWith('/_calculatorSearch')){
  try{
    // Parse the URL and query parameters
    const urlParts = new URL(req.url, `http://${req.headers.host}`);
    const params = urlParts.searchParams;
    
    const price = params.get('price');
    const model_name = params.get('model_name');
    const serial_number = params.get('serial_number');
    const type = params.get('type');

    // Build dynamic SQL query based on provided criteria
    let sql = 'SELECT * FROM Calculators WHERE 1=1';
    const values = [];

    if (price) {
      sql += ' AND price = ?';
      values.push(price);
    }

    if (model_name) {
      sql += ' AND calculator_model LIKE ?';
      values.push(`%${model_name}%`);
    }

    if (serial_number) {
      sql += ' AND calc_serial_num = ?';
      values.push(serial_number);
    }

    if(type){
      sql += ' AND calculator_type LIKE ?';
      values.push(`%${type}%`);
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
  } catch(error){
   console.error('Error processing search request:', error);
   res.writeHead(400, { 'Content-Type': 'application/json' });
   res.end(JSON.stringify({ message: 'Invalid search criteria' }));
  }
}






























//Justins Code

 // Laptop Reservations Table Route
 if (req.method === 'GET' && req.url === '/laptop_reservations') {
  try {
    console.log('Attempting to fetch laptop reservations...');
    
    const query = `SELECT reservation_id, laptop_id, user_id, reservation_date_time FROM laptop_reservations`;
    
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
    
    const query = `SELECT reservation_id, calculator_id, user_id, calc_type, model_name, reservation_date_time FROM calculator_reservations`;
    
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

      // Log the retrieved user details
      console.log('User found:', user);

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