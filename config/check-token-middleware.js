const jwt = require('jsonwebtoken');

const secretKey = 'NODEjs';

const checkToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'Token not found' });
  }
  const tokenWithoutBearer = token.replace('Bearer ', '');
  try {
    jwt.verify(tokenWithoutBearer, secretKey);
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ message: 'Invalid token or token expired' });
  }
};
module.exports = checkToken;