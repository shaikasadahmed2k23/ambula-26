const jwt = require('jsonwebtoken');

const authMiddleware = (role) => (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (role && decoded.role !== role)
      return res.status(403).json({ error: `Access restricted to ${role}s` });
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
