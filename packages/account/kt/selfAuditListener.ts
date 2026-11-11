import type { ListenerEffectAPI } from '@reduxjs/toolkit';

import { KT_ERROR_TYPE, ktSentryReportError } from '@proton/key-transparency/helpers/utils';
import { getSelfAuditDelay } from '@proton/key-transparency/shared/runSelfAudit';
import type {
    ProtonDispatch,
    ProtonThunkArguments,
    SharedStartListening,
} from '@proton/redux-shared-store-types/interface';
import { KEY_TRANSPARENCY_REMINDER_UPDATE } from '@proton/shared/lib/drawer/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';
import noop from '@proton/utils/noop';

import type { ApiStatusReducerState } from '../apiStatus';
import { bootstrapEvent } from '../bootstrap/action';
import { ktSlice, selectKTActivation, selectKTSelfAuditResult } from './index';
import {
    type SelfAuditRequiredState,
    loadSelfAuditResultThunk,
    runSelfAuditThunk,
    storeSelfAuditResultThunk,
} from './selfAuditActions';

interface RequiredState extends SelfAuditRequiredState, ApiStatusReducerState {}

type ListenerApi = ListenerEffectAPI<RequiredState, ProtonDispatch<any>, ProtonThunkArguments>;

const getIsBrowserOnline = () => {
    return typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean' || navigator.onLine;
};

/** The conditions to audit that are in the store, i.e. all but the browser being online */
const getCanSelfAudit = (state: RequiredState) => {
    return selectKTActivation(state) !== KeyTransparencyActivation.DISABLED && !state.apiStatus.offline;
};

/** Resolves on the next `online` event, or on abort so that the event listener doesn't outlive the listener */
const waitForBrowserOnline = (signal: AbortSignal) => {
    return new Promise<void>((resolve) => {
        const done = () => {
            window.removeEventListener('online', done);
            signal.removeEventListener('abort', done);
            resolve();
        };
        window.addEventListener('online', done);
        signal.addEventListener('abort', done);
    });
};

/**
 * A due audit waits until KT is enabled and both the browser and the API are online, and then runs right away.
 * No action is dispatched when the browser comes back online, so that's waited for separately from the store.
 */
const waitUntilSelfAuditAllowed = async (listenerApi: ListenerApi) => {
    while (true) {
        if (!getIsBrowserOnline()) {
            await listenerApi.pause(waitForBrowserOnline(listenerApi.signal));
        } else if (!getCanSelfAudit(listenerApi.getState())) {
            await listenerApi.condition((_, state) => getCanSelfAudit(state));
        } else {
            return;
        }
    }
};

/**
 * Periodically audits the user's keys, from the app bootstrap and for as long as the store lives.
 * The result of the last audit is kept in local storage, it decides when the next audit is due across sessions.
 */
export const ktSelfAuditListener = (startListening: SharedStartListening<RequiredState>) => {
    startListening({
        actionCreator: bootstrapEvent,
        effect: async (_, listenerApi) => {
            listenerApi.unsubscribe();

            const storedSelfAuditResult = await listenerApi.dispatch(loadSelfAuditResultThunk()).catch(noop);
            if (storedSelfAuditResult) {
                listenerApi.dispatch(ktSlice.actions.selfAuditResult(storedSelfAuditResult));
            }

            while (true) {
                await listenerApi.delay(getSelfAuditDelay(selectKTSelfAuditResult(listenerApi.getState())));
                await waitUntilSelfAuditAllowed(listenerApi);

                try {
                    const selfAuditResult = await listenerApi.dispatch(
                        runSelfAuditThunk(selectKTSelfAuditResult(listenerApi.getState()))
                    );
                    // Only a failed audit carries an error
                    if (!selfAuditResult.error) {
                        document.dispatchEvent(
                            new CustomEvent(KEY_TRANSPARENCY_REMINDER_UPDATE, { detail: { value: false } })
                        );
                    }
                    listenerApi.dispatch(ktSlice.actions.selfAuditResult(selfAuditResult));
                    listenerApi.dispatch(storeSelfAuditResultThunk(selfAuditResult)).catch(noop);
                } catch (error) {
                    // Without a result there's no next audit time to schedule from, so auditing stops for this session
                    ktSentryReportError(error, KT_ERROR_TYPE.LOCAL, { context: 'runSelfAuditPeriodically' });
                    return;
                }
            }
        },
    });
};
