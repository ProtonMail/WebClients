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

export const clientReady = eq(AppStatus.READY);
export const clientBooted = oneOf(AppStatus.READY, AppStatus.OFFLINE_UNLOCKED);
export const clientAuthorized = oneOf(AppStatus.AUTHORIZED);
export const clientUnauthorized = oneOf(AppStatus.UNAUTHORIZED, AppStatus.LOCKED);
export const clientLocked = eq(AppStatus.LOCKED);
export const clientErrored = eq(AppStatus.ERROR);
export const clientStale = eq(AppStatus.IDLE);
export const clientOfflineLocked = eq(AppStatus.OFFLINE_LOCKED);
export const clientOfflineUnlocked = eq(AppStatus.OFFLINE_UNLOCKED);

export const clientBusy = oneOf(AppStatus.IDLE, AppStatus.AUTHORIZED, AppStatus.AUTHORIZING, AppStatus.BOOTING);

export const clientStatusResolved = or(clientReady, clientUnauthorized, clientErrored, clientOfflineLocked);
export const clientCanBoot = or(clientAuthorized, clientUnauthorized, clientErrored);

export const isTaggedBuild = (config: PassConfig) => ENV === 'production' && config.BRANCH.startsWith('proton-pass@');
