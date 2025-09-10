import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';
import type { SecurityCheckupSession } from '@proton/shared/lib/interfaces/securityCheckup';
import { SecurityCheckupCohort } from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';

import {
    getSecurityCheckupSessionItem,
    removeSecurityCheckupSessionItem,
    setSecurityCheckupSessionItem,
} from './securityCheckupSessionStorage';

const now = 1234;
jest.useFakeTimers().setSystemTime(now);

jest.mock('@proton/shared/lib/helpers/sessionStorage', () => ({
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
}));

const mockedRemoveItem = jest.mocked(removeItem);
const mockedGetItem = jest.mocked(getItem);
const mockedSetItem = jest.mocked(setItem);

const userId = 'userId';

describe('securityCheckupSessionStorage', () => {
    test('gets item using correct key', () => {
        getSecurityCheckupSessionItem(userId);

        expect(mockedGetItem).toHaveBeenCalledWith(`SC:${userId}:session`);
    });

    test('returns undefined if no item is in storage', () => {
        mockedGetItem.mockReturnValueOnce(undefined);

        const result = getSecurityCheckupSessionItem(userId);

        expect(result).toEqual(undefined);
    });

    test('returns undefined if storage item is not an object', () => {
        mockedGetItem.mockReturnValueOnce('1234');

        const result = getSecurityCheckupSessionItem(userId);

        expect(result).toEqual(undefined);
    });

    test('returns undefined if storage item is unserialisable', () => {
        mockedGetItem.mockReturnValueOnce('{]}');

        const result = getSecurityCheckupSessionItem(userId);

        expect(result).toEqual(undefined);
    });

    test('returns undefined if initialCohort is not a string', () => {
        mockedGetItem.mockReturnValueOnce(JSON.stringify({ initialCohort: 1234, createdTimestamp: Date.now() }));

        const result = getSecurityCheckupSessionItem(userId);

        expect(result).toEqual(undefined);
    });

    test('returns undefined if createdTimestamp is not a number', () => {
        mockedGetItem.mockReturnValueOnce(JSON.stringify({ initialCohort: 'asdf', createdTimestamp: 'asdf' }));

        const result = getSecurityCheckupSessionItem(userId);

        expect(result).toEqual(undefined);
    });

    test('returns session if valid session in storage', () => {
        const validSession: SecurityCheckupSession = {
            initialCohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
            createdTimestamp: Date.now(),
        };
        mockedGetItem.mockReturnValueOnce(JSON.stringify(validSession));

        const result = getSecurityCheckupSessionItem(userId);

        expect(result).toEqual(validSession);
    });
});

describe('setSecurityCheckupSessionItem', () => {
    test('sets serialised item using correct key', () => {
        const validSession: SecurityCheckupSession = {
            initialCohort: SecurityCheckupCohort.Common.NO_RECOVERY_METHOD,
            createdTimestamp: Date.now(),
        };
        setSecurityCheckupSessionItem(validSession, userId);

        expect(mockedSetItem).toHaveBeenCalledWith(
            `SC:${userId}:session`,
            `{\"initialCohort\":\"NO_RECOVERY_METHOD\",\"createdTimestamp\":${now}}`
        );
    });
});

describe('removeSecurityCheckupSessionItem', () => {
    test('removes item using correct key', () => {
        removeSecurityCheckupSessionItem(userId);

        expect(mockedRemoveItem).toHaveBeenCalledWith(`SC:${userId}:session`);
    });
});
