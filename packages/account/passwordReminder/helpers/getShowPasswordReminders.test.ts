import { PASSWORD_REMINDERS_VALUE, type UserModel, type UserSettings } from '@proton/shared/lib/interfaces';
import type { UnleashClient } from '@proton/unleash/UnleashClient';

import { getShowPasswordReminders } from './getShowPasswordReminders';

const now = new Date('2005-05-25');
jest.useFakeTimers().setSystemTime(now);

const makeUnleash = (flags: Record<string, boolean> = { PasswordReminders: true }) =>
    ({ isEnabled: jest.fn((flag: string) => flags[flag] || false) }) as unknown as UnleashClient;

const makeUser = (overrides: Partial<UserModel> = {}): UserModel => ({ isPrivate: true, ...overrides }) as UserModel;

const secondsFromNow = (offsetSeconds: number) => Math.floor(now.getTime() / 1000) + offsetSeconds;

// Show banner because the cadence has expired
const pastNextReminderUser = secondsFromNow(-1);

// Don't show banner until its in the past!
const futureNextReminder = secondsFromNow(1);

const makeUserSettings = ({
    nextPasswordReminderTime = pastNextReminderUser,
    passwordReminderOptOut = PASSWORD_REMINDERS_VALUE.ENABLED,
}: {
    nextPasswordReminderTime?: number | null;
    passwordReminderOptOut?: PASSWORD_REMINDERS_VALUE;
} = {}): UserSettings =>
    ({
        NextPasswordReminderTime: nextPasswordReminderTime,
        Flags: {
            PasswordReminderOptOut: passwordReminderOptOut,
        },
    }) as UserSettings;

describe('getShowPasswordReminders', () => {
    describe('isAvailable', () => {
        it('returns false when the PasswordReminders flag is disabled', () => {
            const unleashClient = makeUnleash({ PasswordReminders: false });

            const result = getShowPasswordReminders({
                unleashClient,
                user: makeUser(),
                userSettings: makeUserSettings(),
            });

            expect(result).toBe(false);
            expect(unleashClient.isEnabled).toHaveBeenCalledWith('PasswordReminders');
        });

        it('returns false when the user is not private', () => {
            const user = makeUser({ isPrivate: false });

            const result = getShowPasswordReminders({
                unleashClient: makeUnleash(),
                user,
                userSettings: makeUserSettings(),
            });

            expect(result).toBe(false);
        });
    });

    describe('isEnabled', () => {
        it('returns false when PasswordReminderOptOut is disabled', () => {
            const userSettings = makeUserSettings({
                passwordReminderOptOut: PASSWORD_REMINDERS_VALUE.DISABLED,
            });

            // A timestamp equal to `now` is also "not before now" — isBefore is strict.
            const result = getShowPasswordReminders({
                unleashClient: makeUnleash(),
                user: makeUser(),
                userSettings,
            });

            expect(result).toBe(false);
        });
    });

    it('returns false when NextPasswordReminderTime is in the future', () => {
        const userSettings = makeUserSettings({ nextPasswordReminderTime: futureNextReminder });

        // A timestamp equal to `now` is also "not before now" — isBefore is strict.
        const result = getShowPasswordReminders({
            unleashClient: makeUnleash(),
            user: makeUser(),
            userSettings,
        });

        expect(result).toBe(false);
    });

    it('returns true when flag enabled, user is private, and reminder time is in the past', () => {
        const result = getShowPasswordReminders({
            unleashClient: makeUnleash(),
            user: makeUser(),
            userSettings: makeUserSettings(),
        });

        expect(result).toBe(true);
    });

    it.each([
        ['0', 0],
        ['null', null],
    ])('returns true when NextPasswordReminderTime is %s (epoch is in the past)', (_label, value) => {
        const userSettings = makeUserSettings({ nextPasswordReminderTime: value });

        const result = getShowPasswordReminders({
            unleashClient: makeUnleash(),
            user: makeUser(),
            userSettings,
        });

        expect(result).toBe(true);
    });
});
