import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';

import { SafetyReviewCohort } from './getCohort';
import type { SafetyReviewTelemetrySession } from './getValidSafetyReviewSession';
import {
    getSafetyReviewSessionItem,
    removeSafetyReviewSessionItem,
    setSafetyReviewSessionItem,
} from './safetyReviewSessionStorage';

const now = 1234;
vi.useFakeTimers().setSystemTime(now);

vi.mock('@proton/shared/lib/helpers/sessionStorage', () => ({
    getItem: vi.fn(),
    removeItem: vi.fn(),
    setItem: vi.fn(),
}));

const mockedRemoveItem = vi.mocked(removeItem);
const mockedGetItem = vi.mocked(getItem);
const mockedSetItem = vi.mocked(setItem);

const userId = 'userId';

describe('safetyReviewSessionStorage', () => {
    test('gets item using correct key', () => {
        getSafetyReviewSessionItem(userId);

        expect(mockedGetItem).toHaveBeenCalledWith(`SR:${userId}:session`);
    });

    test('returns undefined if no item is in storage', () => {
        mockedGetItem.mockReturnValueOnce(undefined);

        const result = getSafetyReviewSessionItem(userId);

        expect(result).toEqual(undefined);
    });

    test('returns undefined if storage item is not an object', () => {
        mockedGetItem.mockReturnValueOnce('1234');

        const result = getSafetyReviewSessionItem(userId);

        expect(result).toEqual(undefined);
    });

    test('returns undefined if storage item is unserialisable', () => {
        mockedGetItem.mockReturnValueOnce('{]}');

        const result = getSafetyReviewSessionItem(userId);

        expect(result).toEqual(undefined);
    });

    test('returns undefined if initialCohort is not a string', () => {
        mockedGetItem.mockReturnValueOnce(JSON.stringify({ initialCohort: 1234, createdTimestamp: Date.now() }));

        const result = getSafetyReviewSessionItem(userId);

        expect(result).toEqual(undefined);
    });

    test('returns undefined if createdTimestamp is not a number', () => {
        mockedGetItem.mockReturnValueOnce(JSON.stringify({ initialCohort: 'asdf', createdTimestamp: 'asdf' }));

        const result = getSafetyReviewSessionItem(userId);

        expect(result).toEqual(undefined);
    });

    test('returns session if valid session in storage', () => {
        const validSession: SafetyReviewTelemetrySession = {
            initialCohort: SafetyReviewCohort.NO_RECOVERY_METHOD,
            createdTimestamp: Date.now(),
        };
        mockedGetItem.mockReturnValueOnce(JSON.stringify(validSession));

        const result = getSafetyReviewSessionItem(userId);

        expect(result).toEqual(validSession);
    });
});

describe('setSecurityCheckupSessionItem', () => {
    test('sets serialised item using correct key', () => {
        const validSession: SafetyReviewTelemetrySession = {
            initialCohort: SafetyReviewCohort.NO_RECOVERY_METHOD,
            createdTimestamp: Date.now(),
        };
        setSafetyReviewSessionItem(validSession, userId);

        expect(mockedSetItem).toHaveBeenCalledWith(
            `SR:${userId}:session`,
            `{\"initialCohort\":\"NO_RECOVERY_METHOD\",\"createdTimestamp\":${now}}`
        );
    });
});

describe('removeSecurityCheckupSessionItem', () => {
    test('removes item using correct key', () => {
        removeSafetyReviewSessionItem(userId);

        expect(mockedRemoveItem).toHaveBeenCalledWith(`SR:${userId}:session`);
    });
});
