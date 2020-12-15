const { Client } = require("pg");

console.log(process.env.NODE_ENV);
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
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
    .then((res) => {
      client.end();
    });
};

exports.saveInformation = function saveInformation(information) {
  return client
    .query(
      `
INSERT INTO shared_information(id, expires_at, encrypted_data)
VALUES ($1, $2, $3)
 `,
      [information.id, information.expiresAt, information.encryptedData]
    )
    .catch((err) => {
      return null;
    });
};

exports.getInformationById = function informationById(id) {
  return client
    .query(`SELECT * FROM shared_information WHERE id=$1`, [id])
    .then((res) => {
      const result = res.rows[0];
      if (result !== undefined) {
        return {
          id: result.id,
          encryptedData: result.encrypted_data,
          expiresAt: result.expires_at,
        };
      } else {
        return null;
      }
    })
    .catch((err) => {
      return null;
    });
};

exports.deleteInformationById = function informationById(id) {
  return client.query(`DELETE FROM shared_information WHERE id=$1`, [id]);
};
