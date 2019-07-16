require('dotenv').config();
import { Router } from 'express';
const router = Router();
import passport from 'passport';
import passportFitbit from 'passport-fitbit-oauth2';
import url from 'url';
const moment = require('moment');
import { verifyToken } from '../middleware/auth';

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
			callbackURL: `${config.apiUrl}/v1/auth/fitbit/fitbit-callback`,
			passReqToCallback: true
		},
		(req: any, accessToken: any, refreshToken: any, profile: any, done: any) => {
			// when Fitbit account is created, link to the user's Facebook account
			const cookieData: any = FbHelper.getFbJwtFromCookie(req.cookies);
			if (!cookieData.fbId) {
				return done(null, false, {
					message:
						'There has been an error getting your information. Error code: COO1.'
				});
			}
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
router.get('/fitbit-callback', (req, res, next) => {
	passport.authenticate('fitbit', (err, user, info) => {
		if (err) {
			return next(err);
		}
		if (!user) {
			return res.redirect(
				url.format({
					pathname: `${config.clientUrl}/home`,
					query: {
						success: false,
						message: info.message
					}
				})
			);
		}

		// get the existing fbJwt and add the fitbit id to it
		const cookieData: any = FbHelper.getFbJwtFromCookie(req.cookies);
		const fitbitProfile = user.fitbitProfile;
		cookieData.fitbit = {
			fitbitId: fitbitProfile.id,
			fitbitName: fitbitProfile._json.user.displayName,
			fitbitAvatar: fitbitProfile._json.user.avatar150
		};
		const fbToken = FbService.createFbToken(cookieData);

		// then do a request using the access token to get the initial info for the leaderboard
		const theMonth = moment().month();
		const theYear = moment().year();
		FitbitService.getUserStats(fitbitProfile.id, { theMonth, theYear }).then(
			(userStats: any) => {
				FitbitService.saveUserStats(
					fitbitProfile.id,
					{
						monthlySteps: userStats[0],
						monthlyDistance: userStats[1]
					},
					{ theMonth, theYear }
				);
			}
		);
		return res.redirect(
			`${config.clientUrl}/authed-fb?success=true&fbJwt=${fbToken}`
		);
	})(req, res, next);
});

router.post('/refresh-fitbit-tokens', (req, res) => {
	FitbitService.updateAllUsersFitbitTokens()
		.then((response: any) => {
			res.send({
				success: true,
				response
			});
		})
		.catch(() => {
			res.send({
				success: false
			});
		});
});

router.post('/get-user-data', (req, res) => {
	const fbId = req.body.fbId;
	// get users info from facebook
	FbModel.getFbUser(fbId).then((fbUser: ITrackedFacebookUser) => {
		if (!fbUser.fitbitId) {
			res.send({
				fitbitConnected: false,
				isActive: false
			});
			return;
		}
		return FitbitModel.getFitbitUser(fbUser.fitbitId)
			.then((fitbitUser: ITrackedFitbitUser) => {
				return Promise.all([
					fitbitUser.isActive,
					FbModel.getFbUserByFitbitId(fitbitUser.fitbitId),
					FitbitService.getLocalUserStats(fitbitUser.fitbitId)
				]);
			})
			.then(
				([isActive, fbData, fitbitData]: [
					number,
					ITrackedFacebookUser,
					IFitbitActivityDb[]
				]) => {
					const steps = fitbitData.filter(
						(data: IFitbitActivityDb) => data.activityType === 'steps'
					);
					const distance = fitbitData.filter(
						(data: IFitbitActivityDb) => data.activityType === 'distance'
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
				}
			);
	});
});

router.post('/get-active-users-data', (req, res) => {
	// get users info from facebook
	return FitbitModel.getActiveFitbitUsers()
		.then((fitbitUsers: ITrackedFitbitUser[]) => {
			return Promise.all(
				fitbitUsers.map((user: ITrackedFitbitUser) => {
					return Promise.all([
						user,
						FbModel.getFbUserByFitbitId(user.fitbitId),
						FitbitService.getLocalUserStats(user.fitbitId)
					]);
				})
			);
		})
		.then((usersData: any) => {
			const userData = usersData.map((user: any) => {
				const [fitbitData, fbData, fitbitStats]: [
					ITrackedFitbitUser,
					ITrackedFacebookUser,
					IFitbitActivityDb[]
				] = user;
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

router.use(verifyToken());

router.post('/update-past-user-data', (req, res) => {
	FitbitService.updateAllUserFitbitData()
		.then(updated => {
			res.send({
				success: true,
				updated
			});
		})
		.catch(e => {
			res.send({
				success: false
			});
		});
});

module.exports = router;
