import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { STORAGE_PREFIX } from '@proton/shared/lib/authentication/persistedSessionStorage';

import { LAST_ACTIVE_PING } from '../store/_user/useActivePing';
import { sendErrorReport } from './errorHandling';
import { getLastActivePersistedUserSession } from './lastActivePersistedUserSession';

jest.mock('./errorHandling');
const mockedSendErrorReport = jest.mocked(sendErrorReport);

describe('getLastActivePersistedUserSession', () => {
    afterEach(() => {
        window.localStorage.clear();
    });

    it('returns session for the last active user based on LAST_ACTIVE_PING', () => {
        localStorage.setItem(
            `${STORAGE_PREFIX}0`,
            JSON.stringify({ UserID: '1234', UID: 'abcd-1234', persistedAt: 123 }) // first session to be persisted
        );
        localStorage.setItem(
            `${STORAGE_PREFIX}1`,
            JSON.stringify({ UserID: '5678', UID: 'efgh-5678', persistedAt: 567 }) // last session to be persisted
        );

        // Set last active pings
        localStorage.setItem(`${LAST_ACTIVE_PING}_1234`, JSON.stringify({ value: 1000 })); // latest session
        localStorage.setItem(`${LAST_ACTIVE_PING}_5678`, JSON.stringify({ value: 500 })); // previous session

        const result = getLastActivePersistedUserSession();
        expect(result).toEqual({
            UserID: '1234',
            UID: 'abcd-1234',
            blob: '',
            isSelf: true,
            localID: 0,
            payloadType: 'default',
            payloadVersion: 1,
            persistedAt: 123,
            persistent: true,
            trusted: false,
            source: SessionSource.Proton,
        });
    });

    it('returns persisted session if valid session data exists', () => {
        localStorage.setItem(`${STORAGE_PREFIX}0`, JSON.stringify({ UserID: '1234', UID: 'abcd-1234' }));

        const result = getLastActivePersistedUserSession();
        expect(result).toEqual({
            UserID: '1234',
            UID: 'abcd-1234',
            blob: '',
            isSelf: true,
            localID: 0,
            payloadType: 'default',
            payloadVersion: 1,
            persistedAt: 0,
            persistent: true,
            trusted: false,
            source: SessionSource.Proton,
        });
    });

    it('returns null when there are no active sessions', () => {
        const result = getLastActivePersistedUserSession();
        expect(result).toBeNull();
    });

    it('returns last active session for any apps if there is no sessions for Drive', () => {
        localStorage.setItem(
            `${STORAGE_PREFIX}0`,
            JSON.stringify({ UserID: '1234', UID: 'abcd-1234', persistedAt: 123 })
        );
        localStorage.setItem(
            `${STORAGE_PREFIX}1`,
            JSON.stringify({ UserID: '5678', UID: 'abcd-5678', persistedAt: 567 })
        );
        localStorage.setItem(
            `${STORAGE_PREFIX}2`,
            JSON.stringify({ UserID: '9999', UID: 'abcd-9999', persistedAt: 345 })
        );
        const result = getLastActivePersistedUserSession();
        expect(result).toEqual({
            UserID: '5678',
            UID: 'abcd-5678',
            blob: '',
            isSelf: true,
            localID: 1,
            payloadType: 'default',
            payloadVersion: 1,
            persistedAt: 567,
            persistent: true,
            trusted: false,
            source: SessionSource.Proton,
        });
    });

    it('handles localStorage not being available', () => {
        const originalLocalStorage = window.localStorage;
        Object.defineProperty(window, 'localStorage', {
            value: undefined,
            writable: true,
        });

        const result = getLastActivePersistedUserSession();
        expect(result).toBeNull();
        expect(mockedSendErrorReport).toHaveBeenCalled();

        // Restore original localStorage
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            writable: true,
        });
    });

    // This test is a security to break the build if the constants changes since business logic rely on both these constants thru our code base
    it('assert constants', () => {
        expect(STORAGE_PREFIX).toEqual('ps-');
    });
});
