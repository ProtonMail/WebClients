import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { ktSentryReportError } from '@proton/key-transparency/helpers/utils';
import type { SelfAuditResult } from '@proton/key-transparency/interfaces';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { DAY, HOUR, SECOND } from '@proton/shared/lib/constants';
import { KEY_TRANSPARENCY_REMINDER_UPDATE } from '@proton/shared/lib/drawer/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';

import { apiStatusActions, apiStatusReducer, defaultApiStatus } from '../apiStatus';
import { bootstrapEvent } from '../bootstrap/action';
import { ktSlice, selectKTSelfAuditResult } from './index';
import { loadSelfAuditResultThunk, runSelfAuditThunk, storeSelfAuditResultThunk } from './selfAuditActions';
import { ktSelfAuditListener } from './selfAuditListener';

// The audit itself is crypto and network heavy, what's tested here is when the listener runs it.
jest.mock('./selfAuditActions', () => ({
    loadSelfAuditResultThunk: jest.fn(),
    runSelfAuditThunk: jest.fn(),
    storeSelfAuditResultThunk: jest.fn(),
}));

jest.mock('@proton/key-transparency/helpers/utils', () => ({
    KT_ERROR_TYPE: { SYSTEM: 0, LOCAL: 1 },
    ktSentryReportError: jest.fn(),
}));

const mockedLoadSelfAuditResult = jest.mocked(loadSelfAuditResultThunk);
const mockedRunSelfAudit = jest.mocked(runSelfAuditThunk);
const mockedStoreSelfAuditResult = jest.mocked(storeSelfAuditResultThunk);
const mockedKtSentryReportError = jest.mocked(ktSentryReportError);

const NOW = 1_700_000_000_000;
const PENDING_SELF_AUDIT_DELAY = 10 * SECOND;
const SELF_AUDIT_INTERVAL = 4 * HOUR;

type StartListening = Parameters<typeof ktSelfAuditListener>[0];

const getSelfAuditResult = (nextAuditTime: number): SelfAuditResult => {
    return {
        auditTime: Date.now(),
        nextAuditTime,
        addressAuditResults: [],
        localStorageAuditResultsOwnAddress: [],
        localStorageAuditResultsOtherAddress: [],
    };
};

const reducer = combineReducers({
    kt: ktSlice.reducer,
    ...apiStatusReducer,
});

let clearListeners: (() => void) | undefined;

const setup = ({
    ktActivation = KeyTransparencyActivation.LOG_ONLY,
    apiOffline = false,
    storedSelfAuditResult,
}: {
    ktActivation?: KeyTransparencyActivation;
    apiOffline?: boolean;
    storedSelfAuditResult?: SelfAuditResult;
} = {}) => {
    mockedLoadSelfAuditResult.mockReturnValue(async () => storedSelfAuditResult);
    // Each audit schedules the next one a regular interval later
    mockedRunSelfAudit.mockReturnValue(async () => getSelfAuditResult(Date.now() + SELF_AUDIT_INTERVAL));
    mockedStoreSelfAuditResult.mockReturnValue(async () => {});

    const listenerMiddleware = createListenerMiddleware({ extra: {} as ProtonThunkArguments });
    ktSelfAuditListener(listenerMiddleware.startListening as unknown as StartListening);
    clearListeners = listenerMiddleware.clearListeners;

    const store = configureStore({
        reducer,
        preloadedState: {
            kt: { value: ktActivation },
            apiStatus: { ...defaultApiStatus, offline: apiOffline },
        },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    });

    const bootstrap = async () => {
        store.dispatch(bootstrapEvent({ type: 'complete' }));
        await jest.advanceTimersByTimeAsync(0);
    };

    return { store, bootstrap };
};

describe('ktSelfAuditListener', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers().setSystemTime(NOW);
    });

    afterEach(() => {
        clearListeners?.();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('does nothing until the app has bootstrapped', async () => {
        setup();

        await jest.advanceTimersByTimeAsync(DAY);

        expect(mockedLoadSelfAuditResult).not.toHaveBeenCalled();
        expect(mockedRunSelfAudit).not.toHaveBeenCalled();
    });

    it('restores the stored result on bootstrap, and audits again once it is due', async () => {
        const storedSelfAuditResult = getSelfAuditResult(NOW + HOUR);
        const { store, bootstrap } = setup({ storedSelfAuditResult });

        await bootstrap();

        expect(selectKTSelfAuditResult(store.getState())).toEqual(storedSelfAuditResult);

        await jest.advanceTimersByTimeAsync(HOUR - 1);
        expect(mockedRunSelfAudit).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(1);
        expect(mockedRunSelfAudit).toHaveBeenCalledTimes(1);
        expect(mockedRunSelfAudit).toHaveBeenCalledWith(storedSelfAuditResult);

        const selfAuditResult = getSelfAuditResult(NOW + HOUR + SELF_AUDIT_INTERVAL);
        expect(selectKTSelfAuditResult(store.getState())).toEqual(selfAuditResult);
        expect(mockedStoreSelfAuditResult).toHaveBeenCalledWith(selfAuditResult);
    });

    it('audits shortly after bootstrap when there is no stored result', async () => {
        const { bootstrap } = setup();

        await bootstrap();

        await jest.advanceTimersByTimeAsync(PENDING_SELF_AUDIT_DELAY - 1);
        expect(mockedRunSelfAudit).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(1);
        expect(mockedRunSelfAudit).toHaveBeenCalledTimes(1);
        expect(mockedRunSelfAudit).toHaveBeenCalledWith(undefined);
    });

    it('audits shortly after bootstrap when the stored result is overdue', async () => {
        const storedSelfAuditResult = getSelfAuditResult(NOW - HOUR);
        const { bootstrap } = setup({ storedSelfAuditResult });

        await bootstrap();
        await jest.advanceTimersByTimeAsync(PENDING_SELF_AUDIT_DELAY);

        expect(mockedRunSelfAudit).toHaveBeenCalledTimes(1);
        expect(mockedRunSelfAudit).toHaveBeenCalledWith(storedSelfAuditResult);
    });

    it('audits shortly after bootstrap when the stored result fails to load', async () => {
        const { bootstrap } = setup();
        mockedLoadSelfAuditResult.mockReturnValue(async () => {
            throw new Error('Cross storage unavailable');
        });

        await bootstrap();
        await jest.advanceTimersByTimeAsync(PENDING_SELF_AUDIT_DELAY);

        expect(mockedRunSelfAudit).toHaveBeenCalledTimes(1);
        expect(mockedRunSelfAudit).toHaveBeenCalledWith(undefined);
    });

    it('schedules each audit from the result of the previous one', async () => {
        const { bootstrap } = setup();

        await bootstrap();
        await jest.advanceTimersByTimeAsync(PENDING_SELF_AUDIT_DELAY);
        expect(mockedRunSelfAudit).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(SELF_AUDIT_INTERVAL - 1);
        expect(mockedRunSelfAudit).toHaveBeenCalledTimes(1);

        await jest.advanceTimersByTimeAsync(1);
        expect(mockedRunSelfAudit).toHaveBeenCalledTimes(2);
        expect(mockedRunSelfAudit).toHaveBeenLastCalledWith(
            expect.objectContaining({ nextAuditTime: NOW + PENDING_SELF_AUDIT_DELAY + SELF_AUDIT_INTERVAL })
        );
    });

    it('waits for key transparency to be enabled to run a due audit', async () => {
        const { store, bootstrap } = setup({ ktActivation: KeyTransparencyActivation.DISABLED });

        await bootstrap();
        await jest.advanceTimersByTimeAsync(DAY);
        expect(mockedRunSelfAudit).not.toHaveBeenCalled();

        store.dispatch(ktSlice.actions.value(KeyTransparencyActivation.LOG_ONLY));
        await jest.advanceTimersByTimeAsync(0);

        expect(mockedRunSelfAudit).toHaveBeenCalledTimes(1);
    });

    it('waits for the api to be reachable to run a due audit', async () => {
        const { store, bootstrap } = setup({ apiOffline: true });

        await bootstrap();
        await jest.advanceTimersByTimeAsync(DAY);
        expect(mockedRunSelfAudit).not.toHaveBeenCalled();

        store.dispatch(apiStatusActions.update({ offline: false }));
        await jest.advanceTimersByTimeAsync(0);

        expect(mockedRunSelfAudit).toHaveBeenCalledTimes(1);
    });

    it('waits for the browser to be online to run a due audit', async () => {
        const onLine = jest.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
        const { bootstrap } = setup();

        await bootstrap();
        await jest.advanceTimersByTimeAsync(DAY);
        expect(mockedRunSelfAudit).not.toHaveBeenCalled();

        onLine.mockReturnValue(true);
        window.dispatchEvent(new Event('online'));
        await jest.advanceTimersByTimeAsync(0);

        expect(mockedRunSelfAudit).toHaveBeenCalledTimes(1);
    });

    it('stops auditing when an audit fails without a result', async () => {
        const error = new Error('User has no user keys');
        const { bootstrap } = setup();
        mockedRunSelfAudit.mockReturnValue(async () => {
            throw error;
        });

        await bootstrap();
        await jest.advanceTimersByTimeAsync(PENDING_SELF_AUDIT_DELAY);

        expect(mockedRunSelfAudit).toHaveBeenCalledTimes(1);
        expect(mockedKtSentryReportError).toHaveBeenCalledWith(error, expect.anything(), {
            context: 'runSelfAuditPeriodically',
        });

        await jest.advanceTimersByTimeAsync(DAY);
        expect(mockedRunSelfAudit).toHaveBeenCalledTimes(1);
    });

    it('keeps auditing when the result fails to be stored', async () => {
        const { bootstrap } = setup();
        mockedStoreSelfAuditResult.mockReturnValue(async () => {
            throw new Error('Cross storage unavailable');
        });

        await bootstrap();
        await jest.advanceTimersByTimeAsync(PENDING_SELF_AUDIT_DELAY + SELF_AUDIT_INTERVAL);

        expect(mockedRunSelfAudit).toHaveBeenCalledTimes(2);
    });

    it('updates the key transparency reminder after a successful audit', async () => {
        const onReminderUpdate = jest.fn();
        document.addEventListener(KEY_TRANSPARENCY_REMINDER_UPDATE, onReminderUpdate);
        const { bootstrap } = setup();

        await bootstrap();
        await jest.advanceTimersByTimeAsync(PENDING_SELF_AUDIT_DELAY);

        document.removeEventListener(KEY_TRANSPARENCY_REMINDER_UPDATE, onReminderUpdate);
        expect(onReminderUpdate).toHaveBeenCalledTimes(1);
        expect(onReminderUpdate.mock.calls[0][0].detail).toEqual({ value: false });
    });

    it('does not update the key transparency reminder after a failed audit', async () => {
        const onReminderUpdate = jest.fn();
        document.addEventListener(KEY_TRANSPARENCY_REMINDER_UPDATE, onReminderUpdate);
        const { bootstrap } = setup();
        mockedRunSelfAudit.mockReturnValue(async () => ({
            ...getSelfAuditResult(Date.now() + HOUR),
            error: { failedTrials: 1, tooManyRetries: false },
        }));

        await bootstrap();
        await jest.advanceTimersByTimeAsync(PENDING_SELF_AUDIT_DELAY);

        document.removeEventListener(KEY_TRANSPARENCY_REMINDER_UPDATE, onReminderUpdate);
        expect(mockedRunSelfAudit).toHaveBeenCalledTimes(1);
        expect(onReminderUpdate).not.toHaveBeenCalled();
    });

    it('stops auditing once the listeners are cleared', async () => {
        const { bootstrap } = setup();

        await bootstrap();
        clearListeners?.();
        await jest.advanceTimersByTimeAsync(DAY);

        expect(mockedRunSelfAudit).not.toHaveBeenCalled();
    });
});
