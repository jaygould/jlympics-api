require('dotenv').config();
import { Router } from 'express';
const router = Router();
import passport from 'passport';
import passportFitbit from 'passport-fitbit-oauth2';

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
		FitbitService.getUserStats(fitbitProfile.id).then((userStats: any) => {
			FitbitService.saveUserStats(fitbitProfile.id, {
				monthlySteps: userStats[0],
				monthlyDistance: userStats[1]
			});
		});
		res.redirect(`http://localhost:3000/authed-fb?success=true&fbJwt=${fbToken}`);
	}
);

router.post('/get-user-data', (req, res) => {
	const fbId = req.body.fbId;
	// get users info from facebook
	FbModel.getFbUser(fbId)
		.then((fbUser: any) => {
			return FitbitModel.getFitbitUser(fbUser.fitbitId);
		})
		.then((fitbitUser: any) => {
			return Promise.all([
				fitbitUser.isActive,
				FitbitService.getLocalUserStats(fitbitUser.fitbitId)
			]);
		})
		.then(([isActive, fitbitData]: any) => {
			res.send({
				isActive,
				fitbitData
			});
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

module.exports = router;
