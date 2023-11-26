CREATE TABLE polls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  min_reward INT NOT NULL,
  max_reward INT NOT NULL
);

CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  poll_id INT,
  question_type ENUM('single', 'multiple') NOT NULL,
  question_text TEXT NOT NULL,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
);

CREATE TABLE options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT,
  option_text VARCHAR(255) NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL
);

CREATE TABLE user_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  poll_id INT,
  question_id INT,
  option_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES options(id) ON DELETE CASCADE
);

CREATE TABLE poll_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  poll_id INT,
  total_votes INT DEFAULT 0,
  option_counts JSON DEFAULT NULL,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
);

-- seed_data.sql

INSERT INTO polls (title, category, start_date, end_date, min_reward, max_reward) VALUES
('Sample Poll 1', 'General', '2023-01-01', '2023-01-10', 10, 50),
('Sample Poll 2', 'Technology', '2023-02-01', '2023-02-10', 5, 30);
