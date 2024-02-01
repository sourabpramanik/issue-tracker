-- Create a non-existing table
CREATE TABLE IF NOT EXISTS Task (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(300) NOT NULL,
  status VARCHAR(10) NOT NULL,
  label VARCHAR(10) NOT NULL,
  author VARCHAR NOT NULL,
);
