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
	fitbitId: string,
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

interface IFitbitActivity {
	dateTime: string;
	value: string;
}

const saveUserStats = (
	fitbitId: string,
	{
		monthlySteps,
		monthlyDistance
	}: {
		monthlySteps: IFitbitActivity[];
		monthlyDistance: IFitbitActivity[];
	},
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
			JSON.stringify(formatFitbitDistance(monthlyDistance))
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
			])
				.then(data => {
					return {
						success: true,
						month: theMonth,
						user,
						data
					};
				})
				.catch(e => {
					return {
						success: false,
						month: theMonth,
						user,
						reason: e.statusCode && e.statusCode === 401 ? 'auth' : null
					};
				});
		});
		return Promise.all(userPromises);
	});
};

const getLocalUserStats = (fitbitId: any) => {
	return FitbitModel.getFitbitActivity(fitbitId);
};

const formatFitbitDistance = (activity: IFitbitActivity[]) => {
	const formatted = activity['activities-distance'].map(
		(dayDistance: IFitbitActivity) => {
			return {
				...dayDistance,
				value: Math.round(parseInt(dayDistance.value) * 100) / 100
			};
		}
	);
	return {
		'activities-distance': formatted
	};
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
	return [].concat.apply([], withWeekCommencing).reduce((r: any, a: any) => {
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

const updateAllUserFitbitData = () => {
	const thisMonth = moment().month();
	const thisYear = moment().year();
	const monthsBacklog = 6;
	let monthCount: any;
	const getUserStatsPromises = [];
	for (
		monthCount = thisMonth;
		monthCount > thisMonth - monthsBacklog;
		monthCount--
	) {
		// get the year and month from the previous year if the month counts
		// back in to negative value
		const theMonth = monthCount < 0 ? monthCount + 12 : monthCount;
		const theYear = monthCount < 0 ? thisYear - 1 : thisYear;
		getUserStatsPromises.push(
			getPastUserStats({ theMonth, theYear })
				.then((usersData: any) => {
					return Promise.all(
						usersData.map((data: any, i: any) => {
							if (data.success === true) {
								return saveUserStats(
									data.user.fitbitId,
									{
										monthlySteps: data.data[0],
										monthlyDistance: data.data[1]
									},
									{ theMonth, theYear }
								).then(() => {
									return usersData[i];
								});
							} else {
								// user data was not retrieved successfully,
								// so send back the response still as it is already
								// formatted from getPastUserStats()
								return usersData[i];
							}
						})
					);
				})
				.catch((e: any) => {
					console.log(e);
				})
		);
	}
	return Promise.all(getUserStatsPromises);
};

const updateAllUsersFitbitTokens = () => {
	return FitbitModel.getFitbitUsers()
		.then((users: any) => {
			return Promise.all(
				users.map((user: ITrackedFitbitUser) => {
					return user.fitbitRefreshToken
						? FitbitHelper.fitbitRefreshTokenWrapper(user.fitbitRefreshToken).catch(
								e => {
									throw {
										success: false,
										userName: user.fitbitName,
										reason: e.statusCode && e.statusCode === 400 ? 'token' : null
									};
								}
						  )
						: null;
				})
			);
		})
		.then((fitbitResponses: ITrackedFitbitUserSource[]) => {
			if (fitbitResponses) {
				return Promise.all(
					fitbitResponses
						// filter out the null responses (users who's refresh was not successful)
						.filter(resp => resp)
						.map((fitbitResponse: ITrackedFitbitUserSource) => {
							const {
								user_id: fitbitId,
								refresh_token: refreshToken,
								access_token: accessToken
							} = fitbitResponse;
							if (fitbitId && refreshToken && accessToken) {
								return FitbitModel.updateUserFitbitRefreshToken(
									fitbitId,
									refreshToken,
									accessToken
								);
							} else {
								throw new Error('Error');
							}
						})
				);
			} else {
				throw new Error('Error');
			}
		})
		.catch((e: any) => console.log(e));
};

export {
	createUser,
	getUserStats,
	getPastUserStats,
	saveUserStats,
	getLocalUserStats,
	formatFitbitDistance,
	formatDataWeek,
	formatDataMonth,
	updateAllUserFitbitData,
	updateAllUsersFitbitTokens
};
