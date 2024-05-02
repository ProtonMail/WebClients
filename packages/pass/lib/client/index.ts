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

export const clientStale = eq(AppStatus.IDLE);
export const clientErrored = eq(AppStatus.ERROR);
export const clientReady = eq(AppStatus.READY);
export const clientAuthorized = eq(AppStatus.AUTHORIZED);
export const clientUnauthorized = eq(AppStatus.UNAUTHORIZED);
export const clientLocked = eq(AppStatus.LOCKED);
export const clientOfflineLocked = eq(AppStatus.OFFLINE_LOCKED);
export const clientOfflineUnlocked = eq(AppStatus.OFFLINE_UNLOCKED);

export const clientBusy = oneOf(AppStatus.IDLE, AppStatus.AUTHORIZED, AppStatus.AUTHORIZING, AppStatus.BOOTING);
export const clientBooted = oneOf(AppStatus.READY, AppStatus.OFFLINE_UNLOCKED);

export const clientCanBoot = or(clientAuthorized, clientUnauthorized, clientErrored);
export const clientHasSession = or(clientBooted, clientLocked, clientOfflineLocked);
export const clientNeedsSession = or(clientErrored, clientUnauthorized);
export const clientStatusResolved = or(clientHasSession, clientNeedsSession);

export const isTaggedBuild = (config: PassConfig) => ENV === 'production' && config.BRANCH.startsWith('proton-pass@');
export const EXTENSION_BUILD = ['chrome', 'firefox'].includes(BUILD_TARGET);
