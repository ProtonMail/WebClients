import { AppStatus } from '../../types';
import { eq, oneOf, or } from '../../utils/fp/predicates';

export const clientAuthorized = eq(AppStatus.AUTHORIZED);
export const clientErrored = eq(AppStatus.ERROR);
export const clientOffline = eq(AppStatus.OFFLINE);
export const clientPasswordLocked = oneOf(AppStatus.PASSWORD_LOCKED, AppStatus.BIOMETRICS_LOCKED);
export const clientReady = eq(AppStatus.READY);
export const clientSessionLocked = eq(AppStatus.SESSION_LOCKED);
export const clientDesktopLocked = eq(AppStatus.DESKTOP_LOCKED);
export const clientStale = eq(AppStatus.IDLE);
export const clientUnauthorized = eq(AppStatus.UNAUTHORIZED);
export const clientMissingScope = eq(AppStatus.MISSING_SCOPE);

export const clientBusy = oneOf(AppStatus.IDLE, AppStatus.AUTHORIZED, AppStatus.AUTHORIZING, AppStatus.BOOTING);
export const clientBooted = oneOf(AppStatus.READY, AppStatus.OFFLINE);

export const clientHasSession = or(clientBooted, clientSessionLocked, clientPasswordLocked, clientDesktopLocked);
export const clientNeedsSession = or(clientErrored, clientUnauthorized, clientMissingScope);
export const clientStatusResolved = or(clientHasSession, clientNeedsSession);
export const clientDisabled = or(clientUnauthorized, clientErrored, clientStale);
export const clientLocked = or(clientSessionLocked, clientPasswordLocked, clientDesktopLocked, clientMissingScope);
