declare module 'cloudinary';
declare module 'passport-fitbit-oauth2';
declare namespace Express {
  export interface Request {
     thisUser?: object
  }
}
