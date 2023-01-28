const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "userData.db");

const app = express();
const bcrypt = require("bcrypt");

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
    SELECT * FROM user WHERE username = '${username}';`;

  const userPasswordQuery = `SELECT * FROM user WHERE password = '${password}';`;

  const dbPassword = await database.get(userPasswordQuery);
  if (dbPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  }

  const dbUser = await database.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
        INSERT INTO
            user (username, name, password, gender, location)
        VALUES (
            '${username}','${name}','${hashedPassword}','${gender}','${location}');`;
    await database.run(createUserQuery);
    response.status(200);
    response.send("User created successfully");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await database.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkForUserQuery = `
        SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(checkForUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (isValidPassword === true) {
      const lengthOfNewPassword = newPassword.length;
      if (lengthOfNewPassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatedPasswordQuery = `
                UPDATE user
                SET password = '${encryptedPassword}'
                WHERE username = '${username}'`;
        await db.run(updatedPasswordQuery);
        response.send("Password Updated");
      }
    } else {
      response.status(400);
      response.send("Invalid Current Password");
    }
  }
});

module.exports = app;
