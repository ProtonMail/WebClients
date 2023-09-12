import { addDays, differenceInMinutes } from 'date-fns';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { UserModel } from '@proton/shared/lib/interfaces';

import { MessageState } from '../logic/messages/messagesTypes';
import { canSetExpiration, getExpirationTime, getMinExpirationTime } from './expiration';

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
