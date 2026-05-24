const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
// Simple request logger for debugging API errors (method, path, body)
app.use((req, res, next) => {
	try {
		const bodyPreview = req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : '';
		console.log(`[req] ${req.method} ${req.originalUrl} ${bodyPreview}`);
	} catch (e) {
		console.log(`[req] ${req.method} ${req.originalUrl}`);
	}
	next();
});

// Response logger: captures status and a preview of the response body
app.use((req, res, next) => {
	const originalSend = res.send.bind(res);
	res.send = function (body) {
		try {
			const bodyPreview = typeof body === 'string' ? body : JSON.stringify(body);
			console.log(`[res] ${req.method} ${req.originalUrl} ${res.statusCode} ${bodyPreview}`);
		} catch (e) {
			console.log(`[res] ${req.method} ${req.originalUrl} ${res.statusCode}`);
		}
		return originalSend(body);
	};
	next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
// Health check for quick reachability tests
app.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: Date.now() });
});
module.exports = app;