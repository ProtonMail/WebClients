import { VERIFICATION_STATUS as MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { VERIFICATION_STATUS as CRYPTO_VERIFICATION_STATUS } from '@proton/crypto/lib/constants';

describe('VERIFICATION_STATUS', () => {
    it('should be a superset of VERIFICATION_STATUS returned by the CryptoAPI', () => {
        // sanity check test since we're not binding the two enum declarations using TS
        for (const statusName of Object.keys(CRYPTO_VERIFICATION_STATUS)) {
            expect(
                MAIL_VERIFICATION_STATUS[statusName as keyof typeof MAIL_VERIFICATION_STATUS]
            ).toBe(
                CRYPTO_VERIFICATION_STATUS[statusName as keyof typeof CRYPTO_VERIFICATION_STATUS]
            );
        }
    });
});
