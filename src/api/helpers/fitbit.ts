import * as request from 'request-promise-native';

const fitbitApiWrapper = (url: any, fitbitId: any, token: any) => {
	return request.get({
		url: `https://api.fitbit.com/1/user/${fitbitId}/${url}`,
		auth: {
			bearer: token
		},
		json: true
	});
};

const fitbitRefreshTokenWrapper = (refreshToken: string) => {
	const authString = `${process.env.FITBIT_CLIENT_ID}:${
		process.env.FITBIT_CLIENT_SECRET
	}`;
	return request
		.post({
			url: `https://api.fitbit.com/oauth2/token`,
			headers: {
				Authorization: `Basic ${Buffer.from(authString).toString('base64')}`
			},
			form: {
				grant_type: 'refresh_token',
				refresh_token: refreshToken
			}
		})
		.then(resp => {
			return JSON.parse(resp);
		});
};

export { fitbitApiWrapper, fitbitRefreshTokenWrapper };
