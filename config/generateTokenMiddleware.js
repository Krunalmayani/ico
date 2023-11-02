const jwt = require('jsonwebtoken');

const secretKey = 'NODEjs';

function generateToken(userId) {
  const payload = {
    userId: userId,
  };
  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
}
function createToken(userId) {
  const token = generateToken(userId);
  return token;
}
module.exports = createToken;