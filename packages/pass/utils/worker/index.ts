/**
 * Be very careful when editing these predicates :
 * They are used accross the worker code-base in order
 * to safe-guard certain actions or block them. Some
 * of them are also used in the UI code to trigger
 * certain effects.
 */
import { WorkerStatus } from '@proton/pass/types';
import { oneOf, or } from '@proton/pass/utils/fp';

export const workerReady = oneOf(WorkerStatus.READY);
export const workerLoggedIn = oneOf(WorkerStatus.AUTHORIZED);
export const workerLoggedOut = oneOf(WorkerStatus.UNAUTHORIZED, WorkerStatus.RESUMING_FAILED, WorkerStatus.LOCKED);
export const workerErrored = oneOf(WorkerStatus.ERROR, WorkerStatus.RESUMING_FAILED);
export const workerStale = oneOf(WorkerStatus.IDLE);

export const workerBusy = oneOf(
    WorkerStatus.IDLE,
    WorkerStatus.AUTHORIZED,
    WorkerStatus.AUTHORIZING,
    WorkerStatus.BOOTING,
    WorkerStatus.RESUMING
);

export const workerStatusResolved = or(workerReady, workerLoggedOut, workerErrored);
export const workerCanBoot = or(workerLoggedIn, workerLoggedOut, workerErrored);
