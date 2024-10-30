const http = require('http');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const hostname = 'localhost';
const port = 5000;
const { parse } = require('querystring');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
        const isMatch = bcrypt.compare(password, user.password);

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
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Error generating token' }));
        }
      });
    } catch (error) {
      console.error('Request data processing error:', error); // Log any errors in processing request data
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid request data' }));
    }
  }

  // ProfilePage2 Route (JWT-protected)
  else if (req.method === 'GET' && req.url === '/ProfilePage2') {
    console.log("ProfilePage2 route hit!"); // Add this log
    const decoded = authenticateToken(req, res);
    if (!decoded) return;

    console.log("Decoded token:", decoded); // Log the decoded token

    const query = 'SELECT user_level, user_ID, first_name, last_name, email FROM user WHERE email = ?';
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
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results[0])); // Return the user's profile details
      }
    });
  }

  // Reports Route (JWT-protected and only for Staff)
else if (req.method === 'GET' && req.url === '/Reports') {
  console.log("Reports route hit!");

  // Authenticate the user via JWT token
  const decoded = authenticateToken(req, res);
  if (!decoded) return;

  // Query to get the user's user_level based on the email from the decoded token
  const query = 'SELECT user_level FROM user WHERE email = ?';
  connection.query(query, [decoded.email], (err, results) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Database error' }));
      return;
    }

    if (results.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'User not found' }));
      return;
    }

    const userLevel = results[0].user_level;

    // Only allow Staff to access the HomePage
    if (userLevel === 'Staff') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Welcome to the HomePage, Staff member!' }));
    } else {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Access Denied: Only staff members can access this page.' }));
    }
  });
}

});

// Start the server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
