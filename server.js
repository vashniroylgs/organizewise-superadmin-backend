const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
const port = 3009;

app.use(bodyParser.json());

// MySQL Connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root1234",
  database: "organizewiseadminpanel",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: ", err);
  } else {
    console.log("Connected to MySQL");
  }
});

// Function to create the staff table
function createAdminTable() {
  const createTableQuery = `
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL
      );`;

  connection.query(createTableQuery, (err, results) => {
    if (err) {
      console.error("Error creating admin table: ", err);
    } else {
      console.log("admin table created successfully");
    }

    // Close the MySQL connection
    connection.end();
  });
}

createAdminTable();

// Endpoint for staff registration
app.post("/api/v1/staffregistration", async (req, res) => {
  try {
    const { name, password, email, role } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the staff data into the database
    const sql =
      "INSERT INTO staff (name, password, email, role) VALUES (?, ?, ?, ?)";
    const values = [name, hashedPassword, email, role];

    connection.query(sql, values, (err, results) => {
      if (err) {
        console.error("Error inserting into the database: ", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }

      res.status(201).json({ message: "Registration successful" });
    });
  } catch (error) {
    console.error("Error in staff registration endpoint: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
