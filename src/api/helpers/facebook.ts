import * as jwt from 'jsonwebtoken';

const getFbJwtFromCookie = (cookie: any) => {
	let cookieData;
	if (cookie.fbJwt) {
		const fbJwt = cookie.fbJwt;
		cookieData = jwt.decode(fbJwt);
	} else {
		cookieData = {};
	}
	return cookieData;
};

export { getFbJwtFromCookie };
