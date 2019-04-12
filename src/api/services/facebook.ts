import cloudinary from 'cloudinary';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import config from '../config';
import * as FbModel from '../models/facebook';

cloudinary.config({
	cloud_name: 'jaygould',
	api_key: '261729422894596',
	api_secret: 'R3_WejsZ2f6ll5KhUBu1paVT-kw'
});

const createUser = (
	userPhoto: any,
	accessToken: any,
	fbId: any,
	displayName: any
) => {
	return new Promise((res, rej) => {
		cloudinary.v2.uploader.upload(
			userPhoto,
			{ use_filename: true, unique_filename: true, folder: 'jlympics' },
			(error: any, result: any) => {
				FbModel.findOrCreateTracked(accessToken, fbId, displayName)
					.then(() => {
						res();
					})
					.catch((err: any) => {
						rej(err);
					});
			}
		);
	});
};

const createFbToken = (user: string) => {
	return jwt.sign(user, config.authSecret, {
		expiresIn: '1h'
	});
};

export { createUser, createFbToken };
