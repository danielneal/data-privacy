const crypto = require("crypto");

const algorithm = "aes256";
const inputEncoding = "utf8";
const outputEncoding = "hex";
const ivLength = 16; // AES blocksize

exports.randomKey = function randomKey() {
  return crypto.randomBytes(16).toString("hex");
};

exports.encrypt = function encrypt(key, text) {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const ciphered = cipher.update(text, inputEncoding, outputEncoding);
  const finalCiphered = ciphered + cipher.final(outputEncoding);
  const ciphertext = iv.toString(outputEncoding) + ":" + finalCiphered;
  return ciphertext;
};

exports.decrypt = function decrypt(key, ciphertext) {
  const components = ciphertext.split(":");
  const iv_from_ciphertext = Buffer.from(components.shift(), outputEncoding);
  const decipher = crypto.createDecipheriv(algorithm, key, iv_from_ciphertext);
  const deciphered = decipher.update(
    components.join(":"),
    outputEncoding,
    inputEncoding
  );
  const finalDeciphered = deciphered + decipher.final(inputEncoding);
  return finalDeciphered;
};
