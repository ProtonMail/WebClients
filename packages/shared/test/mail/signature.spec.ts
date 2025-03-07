import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { VERIFICATION_STATUS as CRYPTO_VERIFICATION_STATUS } from '@proton/crypto/lib/constants';
import { getMailVerificationStatus } from '@proton/shared/lib/mail/signature';

describe('getMailVerificationStatus', () => {
    it('conversion is correct', () => {
        expect(
            Object.keys(CRYPTO_VERIFICATION_STATUS).length
        ).toBeLessThan(
            Object.keys(MAIL_VERIFICATION_STATUS).length
        );
        Object.keys(CRYPTO_VERIFICATION_STATUS).forEach((statusName) => {
            const convertedVerificationStatus = getMailVerificationStatus(CRYPTO_VERIFICATION_STATUS[statusName  as keyof typeof CRYPTO_VERIFICATION_STATUS]);

            // MAIL_VERIFICATION_STATUS should be a superset of VERIFICATION_STATUS returned by the CryptoAPI
            // this test is a sanity check since we're not binding the two enum declarations using TS
            expect(
                convertedVerificationStatus as unknown as CRYPTO_VERIFICATION_STATUS
            ).toBe(
                CRYPTO_VERIFICATION_STATUS[statusName as keyof typeof CRYPTO_VERIFICATION_STATUS]
            );
        });
    });
});
