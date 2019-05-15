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

export { fitbitApiWrapper };
