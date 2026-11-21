const jwt = require('jsonwebtoken');

// middleware that simply verifies a JWT and attaches the payload
function authenticate(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Non authentifié' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide' });
  }
}

// factory returning a middleware that enforces role membership
function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      // authenticate should run before authorize
      return res.status(401).json({ message: 'Non authentifié' });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
