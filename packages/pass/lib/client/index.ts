/**
 * Be very careful when editing these predicates :
 * They are used accross the worker code-base in order
 * to safe-guard certain actions or block them. Some
 * of them are also used in the UI code to trigger
 * certain effects.
 */
import { AppStatus } from '@proton/pass/types';
import { oneOf, or } from '@proton/pass/utils/fp/predicates';

export const clientReady = oneOf(AppStatus.READY);
export const clientAuthorized = oneOf(AppStatus.AUTHORIZED);
export const clientUnauthorized = oneOf(AppStatus.UNAUTHORIZED, AppStatus.LOCKED);
export const clientLocked = oneOf(AppStatus.LOCKED);
export const clientErrored = oneOf(AppStatus.ERROR, AppStatus.RESUMING_FAILED);
export const clientStale = oneOf(AppStatus.IDLE);

export const clientBusy = oneOf(
    AppStatus.IDLE,
    AppStatus.AUTHORIZED,
    AppStatus.AUTHORIZING,
    AppStatus.BOOTING,
    AppStatus.RESUMING
);

export const clientStatusResolved = or(clientReady, clientUnauthorized, clientErrored);
export const clientCanBoot = or(clientAuthorized, clientUnauthorized, clientErrored);
