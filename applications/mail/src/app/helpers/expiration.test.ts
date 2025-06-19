import { add, addDays, differenceInMinutes, getUnixTime, sub } from 'date-fns';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { canSetExpiration, getExpirationTime, getMinExpirationTime, isExpired } from './expiration';

describe('canSetExpiration', () => {
    const messageState = {
        data: {
            LabelIDs: ['label1', 'label2'],
        },
    } as MessageState;
    const incorrectMessageState = {
        data: {
            LabelIDs: [MAILBOX_LABEL_IDS.SPAM, MAILBOX_LABEL_IDS.TRASH],
        },
    } as MessageState;
    it('should return false if feature flag is false', () => {
        expect(canSetExpiration(false, { hasPaidMail: true } as UserModel, messageState)).toBe(false);
    });

    it('should return false if user is free', () => {
        expect(canSetExpiration(true, { isFree: true } as UserModel, messageState)).toBe(false);
    });

    it('should return false if user is paid but not paid mail', () => {
        expect(canSetExpiration(true, { isPaid: true, hasPaidMail: false } as UserModel, messageState)).toBe(false);
    });

    it('should return true if feature flag is true and user is paid mail', () => {
        expect(canSetExpiration(true, { hasPaidMail: true } as UserModel, messageState)).toBe(true);
    });

    it('should return false if labelIDs contains spam or trash', () => {
        expect(canSetExpiration(true, { hasPaidMail: true } as UserModel, incorrectMessageState)).toBe(false);
    });
});

describe('getExpirationTime', () => {
    it('should return null if days is undefined', () => {
        expect(getExpirationTime(undefined)).toBe(null);
    });

    it('should return a Unix timestamp if days is > 0', () => {
        expect(getExpirationTime(addDays(new Date(), 1))).toBeGreaterThan(0);
    });
});

describe('isExpired', () => {
    it('should return false', () => {
        expect(isExpired({ ExpirationTime: getUnixTime(add(new Date(), { hours: 1 })) })).toBeFalsy();
    });

    describe('when message expiration is before now', () => {
        it('should return true', () => {
            expect(isExpired({ ExpirationTime: getUnixTime(sub(new Date(), { hours: 1 })) })).toBeTruthy();
        });
    });

    describe('when date is provided', () => {
        const timestamp = getUnixTime(new Date(2023, 7, 27, 0, 0, 0, 0));

        describe('when message expiration is after provided date', () => {
            it('should return false', () => {
                expect(
                    isExpired({ ExpirationTime: getUnixTime(sub(new Date(), { hours: 1 })) }, timestamp)
                ).toBeFalsy();
            });
        });

        describe('when message expiration is before provided date', () => {
            it('should return true', () => {
                expect(
                    isExpired({ ExpirationTime: getUnixTime(sub(new Date(timestamp), { hours: 1 })) }, timestamp)
                ).toBeTruthy();
            });
        });
    });
});

describe('getMinExpirationTime', () => {
    it('should return undefined if date is not today', () => {
        expect(getMinExpirationTime(addDays(new Date(), 1))).toBe(undefined);
    });

    it('should return a Date if date is today', () => {
        expect(getMinExpirationTime(new Date())).toBeInstanceOf(Date);
    });

    it('should return a Date with minutes set to 0 or 30', () => {
        const date = getMinExpirationTime(new Date());
        const minutes = date?.getMinutes();
        expect(minutes === 0 || minutes === 30).toBe(true);
    });

    it('should return a older next interval from now with a difference of at least 15 minutes', () => {
        const now = new Date();
        const interval = getMinExpirationTime(now);

        if (!interval) {
            throw new Error('Interval is undefined');
        }

        expect(interval > now).toBe(true);
        expect(differenceInMinutes(interval, now)).toBeGreaterThanOrEqual(15);
    });
});
