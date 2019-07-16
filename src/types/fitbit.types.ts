interface ITrackedFitbitUser {
	id?: number;
	fitbitId?: string;
	fitbitToken?: string;
	fitbitRefreshToken?: string;
	fitbitName?: string;
	isActive?: string;
	createdAt?: string;
	updatedAt?: string;
}
interface ITrackedFitbitUserSource {
	user_id?: number;
	refresh_token?: string;
	access_token?: string;
	success?: boolean;
}
interface IFitbitActivityDb {
	id?: number;
	fitbitId?: string;
	month?: string;
	activityType?: string;
	activityValue?: string;
}
