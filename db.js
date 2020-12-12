const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect();

exports.migrate = async function migrate() {
  client.query(`
CREATE TABLE IF NOT EXISTS shared_information(
  id uuid PRIMARY KEY,
  expires_at DATE,
  encrypted_data TEXT
)
`);
};

exports.saveInformation = async function saveInformation(information) {
  client.query(
    `
INSERT INTO shared_information(id, expires_at, encrypted_data)
VALUES ($1, $2, $)
 `,
    [information.id, information.expiresAt, information.encryptedData]
  );
};

exports.getInformationById = async function informationById(id) {
  client
    .query(` SELECT * FROM shared_information WHERE id=$1`, [id])
    .then((res) => res.rows[0]);
};

exports.deleteInformationById = async function informationById(id) {
  client.query(`DELETE FROM shared_information WHERE id=$1`, [id]);
};
