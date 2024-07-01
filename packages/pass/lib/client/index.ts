/**
 * Be very careful when editing these predicates :
 * They are used accross the worker code-base in order
 * to safe-guard certain actions or block them. Some
 * of them are also used in the UI code to trigger
 * certain effects.
 */
import type { PassConfig } from '@proton/pass/hooks/usePassConfig';
import { AppStatus } from '@proton/pass/types';
import { eq, oneOf, or } from '@proton/pass/utils/fp/predicates';

export const clientAuthorized = eq(AppStatus.AUTHORIZED);
export const clientErrored = eq(AppStatus.ERROR);
export const clientOffline = eq(AppStatus.OFFLINE);
export const clientPasswordLocked = eq(AppStatus.PASSWORD_LOCKED);
export const clientReady = eq(AppStatus.READY);
export const clientSessionLocked = eq(AppStatus.SESSION_LOCKED);
export const clientStale = eq(AppStatus.IDLE);
export const clientUnauthorized = eq(AppStatus.UNAUTHORIZED);
export const clientMissingScope = eq(AppStatus.MISSING_SCOPE);

export const clientBusy = oneOf(AppStatus.IDLE, AppStatus.AUTHORIZED, AppStatus.AUTHORIZING, AppStatus.BOOTING);
export const clientBooted = oneOf(AppStatus.READY, AppStatus.OFFLINE);

export const clientCanBoot = or(clientAuthorized, clientUnauthorized, clientErrored);
export const clientHasSession = or(clientBooted, clientSessionLocked, clientPasswordLocked);
export const clientNeedsSession = or(clientErrored, clientUnauthorized, clientMissingScope);
export const clientStatusResolved = or(clientHasSession, clientNeedsSession);
export const clientDisabled = or(clientUnauthorized, clientErrored, clientStale);
export const clientLocked = or(clientSessionLocked, clientPasswordLocked, clientMissingScope);

export const isTaggedBuild = (config: PassConfig) => ENV === 'production' && config.BRANCH.startsWith('proton-pass@');
export const EXTENSION_BUILD = ['chrome', 'firefox', 'safari'].includes(BUILD_TARGET);
export const DESKTOP_BUILD = ['darwin', 'linux', 'win32'].includes(BUILD_TARGET);
