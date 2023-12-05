const express = require("express");
const mysql = require("mysql2/promise"); // Using mysql2 with promises
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const port = 3009;

app.use(cors());

app.use(bodyParser.json());

// MySQL Connection Pool1 which is organizewise database
const pool1 = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root1234",
  database: "organizewiseadminpanel",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

//mysql connection pool2 which is bitrix database
const pool2 = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root1234",
  database: "bitrix",
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
        mobilenumber TEXT
      );`;

  const connection = await pool1.getConnection();

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
app.put("/update", async (req, res) => {
  const { username } = req.body;
  const updateQuery = "DELETE FROM admins WHERE username = ?";

  const connection = await pool1.getConnection();

  try {
    await connection.execute(updateQuery, [username]);
    res.json({
      success: true,
      message: `Admin with username ${username} deleted successfully.`,
    });
  } catch (error) {
    console.error("Error executing delete query:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    connection.release();
  }
});

app.post("/register", async (req, res) => {
  try {
    const { username, password, email, mobilenumber } = req.body;

    // Check if the username, email, and mobile number already exist
    const checkUserQuery =
      "SELECT COUNT(*) AS count FROM admins WHERE username = ? OR email = ? OR mobilenumber = ?";
    const connection = await pool1.getConnection();

    try {
      const [result] = await connection.execute(checkUserQuery, [
        username,
        email,
        mobilenumber,
      ]);
      const userExists = result[0].count > 0;

      if (userExists) {
        const existingFields = [];
        if (result[0].count > 0) existingFields.push("Username");
        if (result[1].count > 0) existingFields.push("Email");
        if (result[2].count > 0) existingFields.push("Mobile Number");

        res.status(400).json({
          success: false,
          message: `${existingFields.join(
            ", "
          )} already exists. Please choose different values.`,
        });
        return;
      }

      // Insert the record if the username, email, and mobile number don't exist
      const hashedPassword = await bcrypt.hash(password, 10);
      await connection.execute(
        `INSERT INTO admins (username, password, email, mobilenumber) VALUES (?, ?, ?, ?)`,
        [username, hashedPassword, email, mobilenumber]
      );

      res.json({
        success: true,
        message: "Record inserted successfully in admins table",
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error inserting record in admins table:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const selectUserQuery = `SELECT * FROM admins WHERE username = '${username.username}';`;
  const connection = await pool1.getConnection();
  const databaseUser = await connection.execute(selectUserQuery);
  const hashedPasswordd = databaseUser[0][0].password;
  if (databaseUser[0] === undefined) {
    response.status(400);
    response.send({ error_msg: "Invalid user" });
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password.password,
      hashedPasswordd
    );
    if (isPasswordMatched === true) {
      const payload = {
        username: username.username,
      };
      const jwt_token = jwt.sign(payload, "MY_SECRET_TOKEN");
      res.send({ jwt_token });
    } else {
      res.status(400);
      res.send({ error_msg: "Invalid password" });
    }
  }
});

//Posting API to post the organization details in organization table
app.post("/addorganization", async (req, res) => {
  try {
    const {
      organizationName,
      description,
      industry,
      address,
      city,
      country,
      state,
      postalCode,
      phone,
      companyEmail,
      website,
      responsiblePerson,
      companyRegistrationNumber,
      companyLogo,
    } = req.body;

    console.log(req.body);

    const connection = await pool2.getConnection();
    await connection.execute(
      `INSERT INTO organizationsTable (
        organiztionName ,
        Description ,
        Industry ,
        Address ,
        City ,
        State ,
        Country ,
        PostalCode ,
        phone ,
        CompanyEmail ,
        Website ,
        ResponsiblePerson ,
        CompanyRegistrationNumber ,
        CompanyLogo 
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        organizationName,
        description,
        industry,
        address,
        city,
        state,
        country,
        postalCode,
        phone,
        companyEmail,
        website,
        responsiblePerson,
        companyRegistrationNumber,
        companyLogo,
      ]
    );

    connection.release();

    res.json({
      success: true,
      message: "Record Inserted Successfully in Organization Table",
    });
  } catch (error) {
    console.log("Error inserting record in organization table", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//api to get the data from bitrix database which data in organizationstable
app.get("/getorganizations", async (req, res) => {
  const getOrganizationsquery = `SELECT * FROM organizationstable`;
  const connection = await pool2.getConnection();
  try {
    const organizationsQuery = await connection.execute(getOrganizationsquery);
    const organizationsData = organizationsQuery[0];
    console.log(organizationsData);
    res.json({
      success: true,
      message: "Fetched data from organizations table",
      data: organizationsData,
    });
  } catch (error) {
    console.error("Error executing get organizations", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    connection.release();
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
