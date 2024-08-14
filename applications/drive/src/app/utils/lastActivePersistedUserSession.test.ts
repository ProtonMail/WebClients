import { STORAGE_PREFIX } from '@proton/shared/lib/authentication/persistedSessionStorage';

import { LAST_ACTIVE_PING } from '../store/_user/useActivePing';
import { sendErrorReport } from './errorHandling';
import { getLastActivePersistedUserSessionUID } from './lastActivePersistedUserSession';

jest.mock('./errorHandling');
const mockedSendErrorReport = jest.mocked(sendErrorReport);

describe('getLastActivePersistedUserSessionUID', () => {
    afterEach(() => {
        window.localStorage.clear();
    });

    it('returns UID if valid session data exists', () => {
        localStorage.setItem(`${LAST_ACTIVE_PING}-1234`, JSON.stringify({ value: Date.now() }));
        localStorage.setItem(`${STORAGE_PREFIX}session`, JSON.stringify({ UserID: '1234', UID: 'abcd-1234' }));

        const result = getLastActivePersistedUserSessionUID();
        expect(result).toBe('abcd-1234');
    });

    it('returns null when there are no active sessions', () => {
        const result = getLastActivePersistedUserSessionUID();
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
        const result = getLastActivePersistedUserSessionUID();
        expect(result).toBe('abcd-5678');
    });

    it('handles JSON parse errors', () => {
        localStorage.setItem(`${LAST_ACTIVE_PING}-1234`, 'not a JSON');
        const result = getLastActivePersistedUserSessionUID();
        expect(result).toBeNull();
        expect(mockedSendErrorReport).toHaveBeenCalled();
    });

    // This test is a security to break the build if the constants changes since business logic rely on both these constants thru our code base
    it('assert constants', () => {
        expect(LAST_ACTIVE_PING).toEqual('drive-last-active');
        expect(STORAGE_PREFIX).toEqual('ps-');
    });
});
