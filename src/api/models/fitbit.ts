import db from '../../db/models';
const TrackedUsers = db.tracked_users_fitbit;
const FitbitActivity = db.fitbit_activity;

const findOrCreateTracked = (
	accessToken: string,
	refreshToken: string,
	fitbitId: string,
	displayName: string
) => {
	return TrackedUsers.findOne({ where: { fitbitId } }).then((resp: any) => {
		if (!resp) {
			return TrackedUsers.create({
				fitbitId,
				fitbitToken: accessToken,
				fitbitRefreshToken: refreshToken,
				fitbitName: displayName,
				isActive: 1
			});
		} else {
			// if user is already linked with Facebook, update their details
			// anyway because their Facebook access token may change
			return TrackedUsers.update(
				{
					fitbitToken: accessToken,
					fitbitRefreshToken: refreshToken,
					fitbitName: displayName
				},
				{ where: { fitbitId }, returning: true }
			);
		}
	});
};

const getFitbitUser = (fitbitId: any) => {
	return TrackedUsers.findOne({ where: { fitbitId } });
};

const getFitbitUsers = () => {
	return TrackedUsers.findAll();
};

const saveFitbitActivity = (
	fitbitId: any,
	month: any,
	activityType: any,
	activityValue: any
) => {
	return FitbitActivity.findOne({ where: { fitbitId } }).then((resp: any) => {
		if (!resp) {
			return FitbitActivity.create({
				fitbitId,
				month,
				activityType,
				activityValue
			});
		} else if (resp.month != month) {
			return FitbitActivity.create({
				fitbitId,
				month,
				activityType,
				activityValue
			});
		} else if (resp.month == month) {
			return FitbitActivity.update(
				{
					activityValue
				},
				{ where: { fitbitId, month, activityType }, returning: true }
			);
		}
	});
};

const getFitbitActivity = (fitbitId: any) => {
	return FitbitActivity.findAll({ where: { fitbitId } });
};

const updateUserFitbitStatus = (fitbitId: any, activeUpdate: boolean) => {
	return TrackedUsers.update(
		{ isActive: activeUpdate ? 1 : 0 },
		{ where: { fitbitId } }
	);
};

export {
	findOrCreateTracked,
	getFitbitUser,
	getFitbitUsers,
	saveFitbitActivity,
	getFitbitActivity,
	updateUserFitbitStatus
};
