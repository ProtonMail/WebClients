import type { SagaIterator } from 'redux-saga';
import { delay, race, select, take } from 'redux-saga/effects';

import type { Base64, MasterKeyState } from '../../types';
import { selectMasterKey, selectMasterKeyState } from '../selectors';
import { addMasterKey, masterKeyFailed } from '../slices/core/credentials';

/**
 * Only reached if the master key load neither succeeds nor fails — a hung request, or a boot that
 * died before `initializeLumoCritical` ran. Generous, because the mint path legitimately retries
 * five times with a 1s → 2s → 4s → 4s backoff on top of its network calls.
 */
const MASTER_KEY_WAIT_TIMEOUT_MS = 120_000;

/**
 * Suspend until the master key is available, and return it.
 *
 * This is the whole persistence queue. Because the key now lands after first paint, any saga that
 * encrypts — `serializeSpaceSaga` and friends — can start before it exists. Rather than buffering
 * their payloads somewhere, each task simply parks here and the saga runtime holds it: N parked
 * tasks, one wake-up on `addMasterKey`.
 *
 * Throws for the two states that are not "not yet". Callers should let it propagate;
 * `noRaceSameId` already logs and moves on, and the UI reports the failure from
 * `selectMasterKeyState` rather than from a thrown saga.
 *
 * IMPORTANT: the `select` must come before the `take`. A saga channel is a `Channel`, not a
 * `StateFlow` — it has no replay, so a bare `take(addMasterKey)` in a task that started after the
 * key already landed would block forever.
 */
export function* waitForMasterKey(context: string): SagaIterator<Base64> {
    const masterKeyState: MasterKeyState = yield select(selectMasterKeyState);

    switch (masterKeyState.status) {
        case 'ready':
            return masterKeyState.masterKey;
        case 'ineligible':
            throw new Error(`${context}: user is not eligible for Lumo, so there is no master key`);
        case 'failed':
            throw new Error(`${context}: master key failed to load: ${masterKeyState.message}`);
        case 'loading':
            break;
    }

    console.log(`${context}: waiting for the master key`);

    const { ready, failed } = yield race({
        ready: take(addMasterKey),
        failed: take(masterKeyFailed),
        timeout: delay(MASTER_KEY_WAIT_TIMEOUT_MS),
    });

    if (failed) {
        throw new Error(`${context}: master key failed to load: ${failed.payload}`);
    }
    if (!ready) {
        throw new Error(`${context}: timed out after ${MASTER_KEY_WAIT_TIMEOUT_MS}ms waiting for the master key`);
    }

    // Re-read from the store rather than trusting `ready.payload`: by the time this task is
    // rescheduled the state is authoritative, and this keeps the two paths returning the same thing.
    const masterKey: Base64 | undefined = yield select(selectMasterKey);
    if (!masterKey) {
        throw new Error(`${context}: master key vanished between the action and the store read`);
    }
    return masterKey;
}
