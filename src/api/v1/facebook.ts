require('dotenv').config();
import { Router } from 'express';
const router = Router();
import passport from 'passport';
import passportFacebook from 'passport-facebook';

import config from '../config';
import * as FbService from '../services/facebook';

passport.serializeUser(function(user, cb) {
	cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
	cb(null, obj);
});

const FacebookStrategy = passportFacebook.Strategy;
passport.use(
	new FacebookStrategy(
		{
			clientID: process.env.FACEBOOK_CLIENT_ID || '',
			clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
			callbackURL: `${config.apiUrl}/api/v1/auth/facebook/fb-callback`,
			profileFields: ['id', 'displayName', 'picture.type(large)', 'gender']
		},
		(accessToken, refreshToken, profile: any, done) => {
			const userPhoto = profile.photos[0].value;
			const fbId = profile.id;
			const displayName = profile.displayName;
			FbService.createUser(userPhoto, accessToken, fbId, displayName)
				.then(() => {
					done(null, { fbId, userPhoto, displayName });
				})
				.catch(err => done(err));
		}
	)
);

router.use(passport.initialize());
router.use(passport.session());
router.get('/', passport.authenticate('facebook'));
router.get(
	'/fb-callback',
	passport.authenticate('facebook', {
		failureRedirect: `${config.clientUrl}/home?error=true`
	}),
	(req, res) => {
		// success, so send the user's fbId back to the Next server so it can be used
		// in a cookie
		// should create JWT here... just sending fbId back is not safe as anyone can then
		// use it
		const fbToken = FbService.createFbToken(req.user);
		res.redirect(`${config.clientUrl}/authed-fb?success=true&fbJwt=${fbToken}`);
	}
);

module.exports = router;
