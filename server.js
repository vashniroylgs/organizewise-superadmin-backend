const express = require("express");
const mysql = require("mysql2/promise"); // Using mysql2 with promises
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
const port = 3009;

app.use(bodyParser.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root1234",
  database: "organizewiseadminpanel",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Function to create the staff table
async function createAdminTable() {
  const createTableQuery = `
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        mobilenumber INT
      );`;

  const connection = await pool.getConnection();

  try {
    // Execute the query
    await connection.query(createTableQuery);
    console.log("admin table created successfully");
  } catch (err) {
    console.error("Error creating admin table: ", err);
  } finally {
    // Release the connection
    connection.release();
  }
}

createAdminTable();
// Api to register into the super admin panel
app.post("/register", async (req, res) => {
  try {
    const { username, password, email, mobilenumber } = req.body;
    const connection = await pool.getConnection();
    await connection.execute(
      `INSERT INTO admins(
        username, password, email, mobilenumber
      )VALUES(?,?,?,?)`,
      [username, password, email, mobilenumber]
    );
    connection.release();
    res.json({
      success: true,
      message: "Record inserted Successfully in admins table",
    });
  } catch (error) {
    console.error("Error Inserting Record in admins table:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//API to login into the super admin panel
app.post("/login", async (req, res) => {
  const { jsonData } = req.body;
  const { username, password } = jsonData;

  const passwordMatched = await bcrypt.compare(password, password);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
