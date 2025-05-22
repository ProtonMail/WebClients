import { VERIFICATION_STATUS as CRYPTO_VERIFICATION_STATUS } from '@proton/crypto/lib/constants';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { getMailVerificationStatus, getProtonMailSignature } from '@proton/shared/lib/mail/signature';

describe('getMailVerificationStatus', () => {
    it('conversion is correct', () => {
        expect(Object.keys(CRYPTO_VERIFICATION_STATUS).length).toBeLessThan(
            Object.keys(MAIL_VERIFICATION_STATUS).length
        );
        Object.keys(CRYPTO_VERIFICATION_STATUS).forEach((statusName) => {
            const convertedVerificationStatus = getMailVerificationStatus(
                CRYPTO_VERIFICATION_STATUS[statusName as keyof typeof CRYPTO_VERIFICATION_STATUS]
            );

            // MAIL_VERIFICATION_STATUS should be a superset of VERIFICATION_STATUS returned by the CryptoAPI
            // this test is a sanity check since we're not binding the two enum declarations using TS
            expect(convertedVerificationStatus as unknown as CRYPTO_VERIFICATION_STATUS).toBe(
                CRYPTO_VERIFICATION_STATUS[statusName as keyof typeof CRYPTO_VERIFICATION_STATUS]
            );
        });
    });
});

describe('getProtonMailSignature', () => {
    it('should return custom signature when provided', () => {
        const customSignature = 'My custom signature';
        const result = getProtonMailSignature(undefined, undefined, customSignature);
        expect(result).toBe(customSignature);
    });

    it('should return default signature with default link when no options provided', () => {
        const result = getProtonMailSignature();
        expect(result).toContain('Sent with');
        expect(result).toContain('Proton Mail');
        expect(result).toContain('https://proton.me/mail/home');
    });

    it('should return signature with referral link when enabled', () => {
        const referralLink = 'https://proton.me/referral';
        const result = getProtonMailSignature(true, referralLink);
        expect(result).toContain(referralLink);
    });

    it('should return signature with default link when referral link is disabled', () => {
        const result = getProtonMailSignature(false, 'https://proton.me/referral');
        expect(result).toContain('https://proton.me/mail/home');
    });

    it('should return signature with default link when referral link is empty', () => {
        const result = getProtonMailSignature(true, '');
        expect(result).toContain('https://proton.me/mail/home');
    });
});
