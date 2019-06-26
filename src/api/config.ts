require('dotenv').config();
export default {
	authSecret: 'jlympics',
	clientUrl: process.env.CLIENT_URL,
	apiUrl: process.env.API_URL
};
