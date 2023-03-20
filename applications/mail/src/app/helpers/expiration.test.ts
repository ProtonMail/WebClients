import { addDays } from 'date-fns';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { UserModel } from '@proton/shared/lib/interfaces';

import { MessageState } from '../logic/messages/messagesTypes';
import { canSetExpiration, getExpirationTime } from './expiration';

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
        expect(canSetExpiration(false, { isFree: false } as UserModel, messageState)).toBe(false);
    });

    it('should return false if user is free', () => {
        expect(canSetExpiration(true, { isFree: true } as UserModel, messageState)).toBe(false);
    });

    it('should return true if feature flag is true and user is paid', () => {
        expect(canSetExpiration(true, { isFree: false } as UserModel, messageState)).toBe(true);
    });

    it('should return false if labelIDs contains spam or trash', () => {
        expect(canSetExpiration(true, { isFree: false } as UserModel, incorrectMessageState)).toBe(false);
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
