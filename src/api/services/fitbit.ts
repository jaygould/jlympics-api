import * as _ from 'lodash';
import * as FitbitHelper from '../helpers/fitbit';
import * as FbModel from '../models/facebook';
import * as FitbitModel from '../models/fitbit';

const moment = require('moment');

const createUser = (
	accessToken: any,
	refreshToken: any,
	fitbitId: any,
	displayName: any,
	fbId: any
) => {
	return new Promise((res, rej) => {
		FitbitModel.findOrCreateTracked(
			accessToken,
			refreshToken,
			fitbitId,
			displayName
		)
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

const getUserStats = (fitbitId: any) => {
	const thisMonth = moment().month();
	const startOfMonth = moment()
		.startOf('month')
		.format('YYYY-MM-DD');
	return FitbitModel.getFitbitUser(fitbitId)
		.then((user: any) => {
			return Promise.all([
				FitbitHelper.fitbitApiWrapper(
					`activities/steps/date/today/${startOfMonth}.json`,
					fitbitId,
					user.fitbitToken
				),
				FitbitHelper.fitbitApiWrapper(
					`activities/distance/date/today/${startOfMonth}.json`,
					fitbitId,
					user.fitbitToken
				)
			]);
		})
		.then(([monthlySteps, monthlyDistance]: any) => {
			return Promise.all([
				FitbitModel.saveFitbitActivity(
					fitbitId,
					thisMonth,
					'steps',
					JSON.stringify(monthlySteps)
				),
				FitbitModel.saveFitbitActivity(
					fitbitId,
					thisMonth,
					'distance',
					JSON.stringify(monthlyDistance)
				)
			]);
		});
};

export { createUser, getUserStats };
