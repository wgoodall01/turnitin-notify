import {OAuth2Client} from 'google-auth-library';
import {UnauthenticatedError, BadAuthenticationError} from './errors.js';

export const authenticate = (OAUTH_CLIENT_ID, HOSTED_DOMAIN) => {
  // OAUth middleware for all API requests.
  // Makes sure that all requests have valid jwt.
  const client = new OAuth2Client(OAUTH_CLIENT_ID, '', '');

  return async (req, res, next) => {
    // First, look in the 'Authorization' header.
    const authHeader = req.get('Authorization');

    // return 401 if not there
    if (typeof authHeader === 'undefined') {
      res.set('WWW-authenticate', 'Bearer');
      return next(new UnauthenticatedError());
    }

    // Get the auth header, parse the JWT out of it.
    const splitHeader = (authHeader || '').split(' ');
    const jwt = splitHeader[1];

    if (
      jwt === '' ||
      splitHeader.length != 2 ||
      splitHeader[0].toLowerCase() !== 'bearer' ||
      typeof jwt === 'undefined' ||
      jwt.length < 10 // sanity check
    ) {
      return next(new BadAuthenticationError());
    }

    try {
      const login = await client.verifyIdToken({aud: OAUTH_CLIENT_ID, idToken: jwt});
      const payload = login.getPayload();

      if (HOSTED_DOMAIN && payload.hd !== HOSTED_DOMAIN) {
        return next(new BadAuthenticationError());
      }

      // Valid request.
      req.user = payload;
      req.user.id = payload.sub; // For convenience
      return next();
    } catch (err) {
      return next(new BadAuthenticationError());
    }
  };
};
