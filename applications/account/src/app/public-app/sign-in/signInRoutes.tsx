import type { SignInRoutesTable } from './routes/SignInRoutes';
import { credentialsRoute } from './steps/credentials/credentialsRoute';
import { passwordAccountRoute } from './steps/password-account/passwordAccountRoute';
import { lost2FARoute } from './steps/password-account/screens/lost-two-factor/lost2FARoute';
import { ssoRoute } from './steps/sso/ssoRoute';

/**
 * The sign-in's UI: the screens of each of its machines, by the id of the machine's actor, which the sign-in's step or
 * its route's `screenActor` names when the current screen is one of theirs.
 */
export const signInRoutes: SignInRoutesTable = {
    credentials: credentialsRoute,
    sso: ssoRoute,
    passwordAccount: passwordAccountRoute,
    lostTwoFactor: lost2FARoute,
};
