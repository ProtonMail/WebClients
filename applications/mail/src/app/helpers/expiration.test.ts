import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { UserModel } from '@proton/shared/lib/interfaces';

import { canSetExpiration } from './expiration';

describe('canSetExpiration', () => {
    it('should return false if feature flag is false', () => {
        expect(canSetExpiration(false, { isFree: false } as UserModel, MAILBOX_LABEL_IDS.INBOX)).toBe(false);
    });

    it('should return false if user is free', () => {
        expect(canSetExpiration(true, { isFree: true } as UserModel, MAILBOX_LABEL_IDS.INBOX)).toBe(false);
    });

    it('should return false if label is in CANNOT_SET_EXPIRATION', () => {
        expect(canSetExpiration(true, { isFree: false } as UserModel, MAILBOX_LABEL_IDS.SCHEDULED)).toBe(false);
    });

    it('should return true if feature flag is true, user is paid and label is not in CANNOT_SET_EXPIRATION', () => {
        expect(canSetExpiration(true, { isFree: false } as UserModel, MAILBOX_LABEL_IDS.INBOX)).toBe(true);
    });
});
