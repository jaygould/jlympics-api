require('dotenv').config();
import { Router } from 'express';
const router = Router();
import passport from 'passport';
import passportFitbit from 'passport-fitbit-oauth2';
const moment = require('moment');

import * as FbHelper from '../helpers/facebook';
import * as FbModel from '../models/facebook';
import * as FitbitModel from '../models/fitbit';
import * as FbService from '../services/facebook';
import * as FitbitService from '../services/fitbit';

import config from '../config';

passport.serializeUser(function(user, cb) {
	cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
	cb(null, obj);
});

const FitbitStrategy = passportFitbit.FitbitOAuth2Strategy;

passport.use(
	new FitbitStrategy(
		{
			clientID: process.env.FITBIT_CLIENT_ID || '',
			clientSecret: process.env.FITBIT_CLIENT_SECRET || '',
			callbackURL: `${config.apiUrl}/api/v1/auth/fitbit/fitbit-callback`,
			passReqToCallback: true
		},
		(req: any, accessToken: any, refreshToken: any, profile: any, done: any) => {
			// when Fitbit account is created, link to the user's Facebook account
			const cookieData: any = FbHelper.getFbJwtFromCookie(req.cookies);
			FitbitService.createUser(
				accessToken,
				refreshToken,
				profile.id,
				profile.displayName,
				cookieData.fbId
			)
				.then(() => {
					done(null, { fitbitProfile: profile, accessToken });
				})
				.catch(err => done(err));
		}
	)
);

router.use(passport.initialize());
router.use(passport.session());
router.get(
	'/',
	passport.authenticate('fitbit', {
		scope: ['activity', 'heartrate', 'location', 'profile']
	})
);
router.get(
	'/fitbit-callback',
	passport.authenticate('fitbit', {
		failureRedirect: 'http://localhost:3000/home?error=true'
	}),
	(req, res) => {
		// get the existing fbJwt and add the fitbit id to it
		const cookieData: any = FbHelper.getFbJwtFromCookie(req.cookies);
		const fitbitProfile = req.user.fitbitProfile;
		cookieData.fitbit = {
			fitbitId: fitbitProfile.id,
			fitbitName: fitbitProfile._json.user.displayName,
			fitbitAvatar: fitbitProfile._json.user.avatar150
		};
		const fbToken = FbService.createFbToken(cookieData);

		// then do a request using the access token to get the initial info for the leaderboard
		const thisMonth = moment().month();
		FitbitService.getUserStats(fitbitProfile.id, thisMonth).then(
			(userStats: any) => {
				FitbitService.saveUserStats(
					fitbitProfile.id,
					{
						monthlySteps: userStats[0],
						monthlyDistance: userStats[1]
					},
					thisMonth
				);
			}
		);
		res.redirect(`http://localhost:3000/authed-fb?success=true&fbJwt=${fbToken}`);
	}
);

router.post('/get-user-data', (req, res) => {
	const fbId = req.body.fbId;
	// get users info from facebook
	FbModel.getFbUser(fbId).then((fbUser: any) => {
		if (!fbUser.fitbitId) {
			res.send({
				fitbitConnected: false,
				isActive: false
			});
			return;
		}
		return FitbitModel.getFitbitUser(fbUser.fitbitId)
			.then((fitbitUser: any) => {
				return Promise.all([
					fitbitUser.isActive,
					FbModel.getFbUserByFitbitId(fitbitUser.fitbitId),
					FitbitService.getLocalUserStats(fitbitUser.fitbitId)
				]);
			})
			.then(([isActive, fbData, fitbitData]: any) => {
				const steps = fitbitData.filter(data => data.activityType === 'steps');
				const distance = fitbitData.filter(
					data => data.activityType === 'distance'
				);
				const weekFormattedSteps = FitbitService.formatDataWeek(
					'activities-steps',
					steps
				);
				const weekFormattedDistance = FitbitService.formatDataWeek(
					'activities-distance',
					distance
				);
				const monthFormattedSteps = FitbitService.formatDataMonth(
					'activities-steps',
					steps
				);
				const monthFormattedDistance = FitbitService.formatDataMonth(
					'activities-distance',
					distance
				);
				res.send([
					{
						isActive,
						fitbitData,
						fbData,
						weekFormattedSteps,
						weekFormattedDistance,
						monthFormattedSteps,
						monthFormattedDistance
					}
				]);
			});
	});
});

router.post('/get-active-users-data', (req, res) => {
	// get users info from facebook
	return FitbitModel.getActiveFitbitUsers()
		.then((fitbitUsers: any) => {
			return Promise.all(
				fitbitUsers.map((user: any) => {
					return Promise.all([
						user,
						FbModel.getFbUserByFitbitId(user.fitbitId),
						FitbitService.getLocalUserStats(user.fitbitId)
					]);
				})
			);
		})
		.then((usersData: any) => {
			const userData = usersData.map(user => {
				const [fitbitData, fbData, fitbitStats] = user;
				const steps = fitbitStats.filter(data => data.activityType === 'steps');
				const distance = fitbitStats.filter(
					data => data.activityType === 'distance'
				);
				const weekFormattedSteps = FitbitService.formatDataWeek(
					'activities-steps',
					steps
				);
				const weekFormattedDistance = FitbitService.formatDataWeek(
					'activities-distance',
					distance
				);
				const monthFormattedSteps = FitbitService.formatDataMonth(
					'activities-steps',
					steps
				);
				const monthFormattedDistance = FitbitService.formatDataMonth(
					'activities-distance',
					distance
				);
				return {
					fitbitData,
					fbData,
					weekFormattedSteps,
					weekFormattedDistance,
					monthFormattedSteps,
					monthFormattedDistance
				};
			});
			res.send([...userData]);
		});
});

router.post('/update-active-status', (req, res) => {
	const { fitbitId, activeUpdate } = req.body;
	FitbitModel.updateUserFitbitStatus(fitbitId, activeUpdate).then(() => {
		res.send({
			success: true
		});
	});
});

router.get('/update-past-user-data', (req, res) => {
	// ran using a cron in order to update the DB with user data
	// in past monhts to populate the DB
	const lastMonth = moment().month() - 1;
	let monthCount: any;
	for (monthCount = lastMonth; monthCount > lastMonth - 4; monthCount--) {
		const theMonth = monthCount;
		FitbitService.getPastUserStats(theMonth).then((usersData: any) => {
			usersData.forEach((data: any) => {
				FitbitService.saveUserStats(
					data.user.fitbitId,
					{
						monthlySteps: data.data[0],
						monthlyDistance: data.data[1]
					},
					theMonth
				).catch(console.log);
			});
		});
	}
});

module.exports = router;
