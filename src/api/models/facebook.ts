import db from '../../db/models';
const TrackedUsers = db.tracked_users;

const findOrCreateTracked = (
	accessToken: string,
	fbId: string,
	displayName: string
) => {
	return TrackedUsers.findOne({ where: { fbId } }).then((resp: any) => {
		if (!resp) {
			return TrackedUsers.create({
				fbId,
				fbToken: accessToken,
				first: displayName,
				lastName: ''
			}).then((newUser: any) => {
				return newUser;
			});
		} else {
			return resp;
		}
	});
};

export { findOrCreateTracked };
