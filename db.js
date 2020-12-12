const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect();

exports.migrate = function migrate() {
  return client
    .query(
      `
CREATE TABLE IF NOT EXISTS shared_information(
  id uuid PRIMARY KEY,
  expires_at DATE,
  encrypted_data TEXT
)
`
    )
    .then((res) => client.end());
};

exports.saveInformation = function saveInformation(information) {
  return client.query(
    `
INSERT INTO shared_information(id, expires_at, encrypted_data)
VALUES ($1, $2, $)
 `,
    [information.id, information.expiresAt, information.encryptedData]
  );
};

exports.getInformationById = function informationById(id) {
  return client
    .query(` SELECT * FROM shared_information WHERE id=$1`, [id])
    .then((res) => res.rows[0]);
};

exports.deleteInformationById = function informationById(id) {
  return client.query(`DELETE FROM shared_information WHERE id=$1`, [id]);
};
