import db from '../../db/models';
const TrackedUsers = db.tracked_users_fb;

const findOrCreateTracked = (
	accessToken: string,
	fbId: string,
	displayName: string,
	profileImgUrl: string
) => {
	return TrackedUsers.findOne({ where: { fbId } }).then((resp: any) => {
		if (!resp) {
			return TrackedUsers.create({
				fbId,
				fbToken: accessToken,
				first: displayName,
				lastName: '',
				profileImgUrl
			});
		} else {
			// if user is already linked with Facebook, update their details
			// anyway because their Facebook access token may change
			return TrackedUsers.update(
				{
					fbToken: accessToken,
					first: displayName,
					lastName: '',
					profileImgUrl
				},
				{ where: { fbId }, returning: true }
			);
		}
	});
};

const getFbUser = (fbId: any) => {
	return TrackedUsers.findOne({ where: { fbId } }).then((resp: any) => {
		return resp;
	});
};

const linkToFitbitAccount = (fbId: any, fitbitId: any) => {
	return TrackedUsers.update(
		{
			fitbitId
		},
		{ where: { fbId }, returning: true }
	);
};

export { findOrCreateTracked, getFbUser, linkToFitbitAccount };
