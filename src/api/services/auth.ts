import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import * as AuthModel from '../models/auth';

import { ILoginIn, IUser } from '../../types/user.types';
import config from '../config';

const loginUser = ({ email, password }: ILoginIn) => {
	return AuthModel.checkUserExists(email).then((user: IUser) => {
		if (!user) {
			throw new Error('No matching user.');
		}
		return new Promise((res, rej) => {
			bcrypt.compare(password, user.password, (err: Error, success: boolean) => {
				if (err) {
					rej(new Error('The has been an unexpected error, please try again later'));
				}
				if (!success) {
					rej(new Error('Your password is incorrect.'));
				} else {
					res(user);
				}
			});
		});
	});
};

const createUser = ({
	firstName,
	lastName,
	email,
	password
}: Partial<IUser>) => {
	const passwordHash = password && bcrypt.hashSync(password.trim(), 12);
	const newUser: Partial<IUser> = { firstName, lastName, email };
	newUser.password = passwordHash;
	return AuthModel.createAccount(newUser);
};

const createToken = (user: IUser) => {
	return jwt.sign(_.omit(user, 'password'), config.authSecret, {
		expiresIn: '10m'
	});
};

const createRefreshToken = (userEmail: string) => {
	const refreshToken = jwt.sign({ type: 'refresh' }, config.authSecret, {
		expiresIn: '2h' // 1 hour
	});
	return AuthModel.saveRefreshToken(refreshToken, userEmail)
		.then(() => {
			return refreshToken;
		})
		.catch((err: Error) => {
			throw err;
		});
};

const validateRefreshToken = (refreshToken: string) => {
	if (refreshToken != '') {
		return new Promise((res, rej) => {
			jwt.verify(refreshToken, config.authSecret, (err: Error) => {
				if (err) {
					rej({
						code: 'refreshExpired',
						message: 'Refresh token expired - session ended.'
					});
				} else {
					AuthModel.findByRefreshToken(refreshToken)
						.then((user: IUser) => {
							res(user);
						})
						.catch((uErr: Error) => {
							rej(uErr);
						});
				}
			});
		});
	} else {
		throw new Error('There is no refresh token to check.');
	}
};

const validateAuthToken = (authToken: string) => {
	return new Promise((res, rej) => {
		jwt.verify(authToken, config.authSecret, (err: Error) => {
			if (err) {
				rej();
			} else {
				res();
			}
		});
	});
};

export {
	loginUser,
	createUser,
	createToken,
	createRefreshToken,
	validateRefreshToken,
	validateAuthToken
};
