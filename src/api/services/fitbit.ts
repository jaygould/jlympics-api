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

const getUserStats = (fitbitId: any, month: any) => {
	const startOfMonth = moment()
		.month(month)
		.startOf('month')
		.format('YYYY-MM-DD');
	return FitbitModel.getFitbitUser(fitbitId).then((user: any) => {
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
	});
};

const saveUserStats = (
	fitbitId: any,
	{ monthlySteps, monthlyDistance }: any,
	thisMonth: any
) => {
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
};

const getPastUserStats = (month: any) => {
	const start = moment()
		.month(month)
		.startOf('month')
		.format('YYYY-MM-DD');
	const end = moment()
		.month(month)
		.endOf('month')
		.format('YYYY-MM-DD');
	return FitbitModel.getFitbitUsers().then((users: any) => {
		const userPromises = users.map((user: any) => {
			return Promise.all([
				FitbitHelper.fitbitApiWrapper(
					`activities/steps/date/${start}/${end}.json`,
					user.fitbitId,
					user.fitbitToken
				),
				FitbitHelper.fitbitApiWrapper(
					`activities/distance/date/${start}/${end}.json`,
					user.fitbitId,
					user.fitbitToken
				)
			]).then(data => {
				return {
					user,
					data
				};
			});
		});
		return Promise.all(userPromises);
	});
};

const getLocalUserStats = (fitbitId: any) => {
	return FitbitModel.getFitbitActivity(fitbitId);
};

export {
	createUser,
	getUserStats,
	getPastUserStats,
	saveUserStats,
	getLocalUserStats
};
