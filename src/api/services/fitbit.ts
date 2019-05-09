import * as _ from 'lodash';
import * as FbModel from '../models/facebook';
import * as FitbitModel from '../models/fitbit';

const createUser = (
	accessToken: any,
	fitbitId: any,
	displayName: any,
	fbId: any
) => {
	return new Promise((res, rej) => {
		FitbitModel.findOrCreateTracked(accessToken, fitbitId, displayName)
			.then(() => {
				return FbModel.linkToFitbitAccount(fbId, fitbitId);
			})
			.then(() => {
				res();
			})
			.catch((err: any) => {
				rej(err);
			});
	});
};

export { createUser };
