const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
const port = 8000;

app.use(bodyParser.json());

// MySQL Connection
const connection = mysql.createPool({
  host: "localhost",
  user: process.env.your_mysql_username,
  password: process.env.your_mysql_password,
  database: "poll_app",
});

connection.connect();

// API Endpoints

// Poll creation
app.post("/polls", (req, res) => {
  const { title, questions } = req.body;
  const pollInsertQuery = `
  INSERT INTO polls (title) VALUES ('${title}');
`;

  connection.query(pollInsertQuery, (error, results) => {
    if (error) throw error;

    const pollId = results.insertId;
    const questionInsertQueries = questions
      .map(
        (question) => `
    INSERT INTO questions (poll_id, question_text) VALUES (${pollId}, '${question}');
  `
      )
      .join("");

    connection.query(questionInsertQueries, (error) => {
      if (error) throw error;

      res.status(201).json({ message: "Poll created successfully" });
    });
  });
});

// Fetching all created polls with analytics
app.get("/polls", (req, res) => {
  const getAllPollsQuery = `
  SELECT polls.id, title, COUNT(user_votes.id) AS total_votes
  FROM polls
  LEFT JOIN questions ON polls.id = questions.poll_id
  LEFT JOIN options ON questions.id = options.question_id
  LEFT JOIN user_votes ON options.id = user_votes.option_id
  GROUP BY polls.id;
`;

  connection.query(getAllPollsQuery, (error, results) => {
    if (error) throw error;

    res.status(200).json(results);
  });
});

// Updating a particular poll
app.put("/polls/:id", (req, res) => {
  const pollId = req.params.id;
  const { title, questions } = req.body;

  // Update poll details
  const updatePollQuery = `
  UPDATE polls SET title = '${title}' WHERE id = ${pollId};
`;

  // Delete existing questions
  const deleteQuestionsQuery = `
  DELETE FROM questions WHERE poll_id = ${pollId};
`;

  // Insert updated questions
  const questionInsertQueries = questions
    .map(
      (question) => `
  INSERT INTO questions (poll_id, question_text) VALUES (${pollId}, '${question}');
`
    )
    .join("");

  const updatePollTransactionQuery = `
  START TRANSACTION;
  ${updatePollQuery}
  ${deleteQuestionsQuery}
  ${questionInsertQueries}
  COMMIT;
`;

  connection.query(updatePollTransactionQuery, (error) => {
    if (error) {
      connection.rollback();
      throw error;
    }

    res.status(200).json({ message: "Poll updated successfully" });
  });
});

// Fetching user polls and serving questions
app.get("/users/:userId/polls", (req, res) => {
  const userId = req.params.userId;

  const getUserPollsQuery = `
  SELECT polls.id, title
  FROM polls
  LEFT JOIN questions ON polls.id = questions.poll_id
  LEFT JOIN options ON questions.id = options.question_id
  LEFT JOIN user_votes ON options.id = user_votes.option_id
  WHERE user_votes.user_id = ${userId} OR user_votes.user_id IS NULL
  GROUP BY polls.id;
`;

  connection.query(getUserPollsQuery, (error, results) => {
    if (error) throw error;

    res.status(200).json(results);
  });
});

// Submitting a poll and updating user data
app.post("/users/:userId/polls/:pollId/submit", (req, res) => {
  const userId = req.params.userId;
  const pollId = req.params.pollId;
  const { selectedOptions } = req.body;

  // Insert user votes
  const insertUserVotesQueries = selectedOptions
    .map(
      (optionId) => `
  INSERT INTO user_votes (user_id, option_id) VALUES (${userId}, ${optionId});
`
    )
    .join("");

  // Update user data (e.g., rewards)
  const updateUserQuery = `
  UPDATE users SET rewards = rewards + 1 WHERE id = ${userId};
`;

  // Update poll analytics
  const updatePollAnalyticsQuery = `
  UPDATE poll_analytics
  SET total_votes = total_votes + 1
  WHERE poll_id = ${pollId};
`;

  const submitPollTransactionQuery = `
  START TRANSACTION;
  ${insertUserVotesQueries}
  ${updateUserQuery}
  ${updatePollAnalyticsQuery}
  COMMIT;
`;

  connection.query(submitPollTransactionQuery, (error) => {
    if (error) {
      connection.rollback();
      throw error;
    }

    res.status(200).json({ message: "Poll submitted successfully" });
  });
});

// Fetching poll analytics for a particular poll
app.get("/polls/:id/analytics", (req, res) => {
  const pollId = req.params.id;

  const getPollAnalyticsQuery = `
  SELECT poll_id, total_votes
  FROM poll_analytics
  WHERE poll_id = ${pollId};
`;

  connection.query(getPollAnalyticsQuery, (error, results) => {
    if (error) throw error;

    res.status(200).json(results[0]);
  });
});

// 7. Fetching overall poll analytics
app.get("/polls/analytics", (req, res) => {
  const getOverallPollAnalyticsQuery = `
  SELECT poll_id, SUM(total_votes) AS total_votes
  FROM poll_analytics
  GROUP BY poll_id;
`;

  connection.query(getOverallPollAnalyticsQuery, (error, results) => {
    if (error) throw error;

    res.status(200).json(results);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
