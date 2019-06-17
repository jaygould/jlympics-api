const jwt = require('jsonwebtoken');
const config = require('../config');
import * as errors from '../../helpers/error';

const verifyToken = () => {
	return (req, res, next) => {
		let token = req.headers.authorization;
		token = token.replace('Bearer ', '');
		return jwt.verify(token, config.default.authSecret, (jwtErr, decoded) => {
			if (jwtErr) {
				return errors.errorHandler(res, 'Invalid token.', null);
			} else {
				req.thisUser = decoded;
				next();
			}
		});
	};
};

export { verifyToken };
