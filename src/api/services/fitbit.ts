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

const getUserStats = (
	fitbitId: any,
	{
		theMonth,
		theYear
	}: {
		theMonth: number;
		theYear: number;
	}
) => {
	const startOfMonth = moment()
		.month(theMonth)
		.year(theYear)
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
	{
		theMonth,
		theYear
	}: {
		theMonth: number;
		theYear: number;
	}
) => {
	return Promise.all([
		FitbitModel.saveFitbitActivity(
			fitbitId,
			{
				theMonth,
				theYear
			},
			'steps',
			JSON.stringify(monthlySteps)
		),
		FitbitModel.saveFitbitActivity(
			fitbitId,
			{
				theMonth,
				theYear
			},
			'distance',
			JSON.stringify(monthlyDistance)
		)
	]);
};

const getPastUserStats = ({
	theMonth,
	theYear
}: {
	theMonth: number;
	theYear: number;
}) => {
	const start = moment()
		.month(theMonth)
		.year(theYear)
		.startOf('month')
		.format('YYYY-MM-DD');
	const end = moment()
		.month(theMonth)
		.year(theYear)
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

const formatDataWeek = (activityType: string, data: any) => {
	const withWeekCommencing = data.map((point: any) => {
		const dataSet = JSON.parse(point.activityValue);
		return dataSet[activityType].map((day: any) => {
			const week = moment(day.dateTime)
				.startOf('isoWeek')
				.format('YYYY MM DD');
			return {
				week,
				data: day
			};
		});
	});
	return [].concat.apply([], withWeekCommencing).reduce((r, a) => {
		r[a.week] = r[a.week] || [];
		r[a.week].push(a);
		return r;
	}, Object.create(null));
};

const formatDataMonth = (activityType: string, data: any) => {
	const withMonth = data.map((point: any) => {
		const dataSet = JSON.parse(point.activityValue);
		const monthNum = point.month.split('-')[0];
		const month = {
			short: moment.monthsShort(monthNum),
			nice: moment.months(monthNum),
			num: monthNum
		};
		return {
			month,
			data: dataSet[activityType]
		};
	});
	return withMonth;
};

export {
	createUser,
	getUserStats,
	getPastUserStats,
	saveUserStats,
	getLocalUserStats,
	formatDataWeek,
	formatDataMonth
};
