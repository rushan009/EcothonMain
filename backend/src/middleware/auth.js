const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev_access_secret';

module.exports = async function requireAuth(req, res, next) {
	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

		if (!token) {
			return res.status(401).json({ message: 'Authentication required' });
		}

		const payload = jwt.verify(token, ACCESS_SECRET);
		const user = await User.findById(payload.sub).select('-password -refreshToken');

		if (!user) {
			return res.status(401).json({ message: 'User not found' });
		}

		req.user = user;
		req.auth = payload;
		next();
	} catch (err) {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
};
