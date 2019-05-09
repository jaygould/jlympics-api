import db from '../../db/models';
const TrackedUsers = db.tracked_users_fitbit;

const findOrCreateTracked = (
	accessToken: string,
	fitbitId: string,
	displayName: string
) => {
	return TrackedUsers.findOne({ where: { fitbitId } }).then((resp: any) => {
		if (!resp) {
			return TrackedUsers.create({
				fitbitId,
				fitbitToken: accessToken,
				fitbitName: displayName
			});
		} else {
			// if user is already linked with Facebook, update their details
			// anyway because their Facebook access token may change
			return TrackedUsers.update(
				{
					fitbitToken: accessToken,
					fitbitName: displayName
				},
				{ where: { fitbitId }, returning: true }
			);
		}
	});
};

export { findOrCreateTracked };
