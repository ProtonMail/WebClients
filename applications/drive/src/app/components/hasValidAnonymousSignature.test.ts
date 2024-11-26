import { VERIFICATION_STATUS } from '@proton/srp/lib/constants';

import type { SignatureIssues } from '../store';
import { hasValidAnonymousSignature } from './hasValidAnonymousSignature';

describe('hasValidAnonymousSignature', () => {
    beforeEach(() => {
        // Spy on console.warn
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return true when thumbnail and blocks are NOT signed and others are valid', () => {
        const signatureIssues: SignatureIssues = {
            manifest: VERIFICATION_STATUS.SIGNED_AND_VALID,
            thumbnail: VERIFICATION_STATUS.NOT_SIGNED,
            blocks: VERIFICATION_STATUS.NOT_SIGNED,
            passphrase: VERIFICATION_STATUS.SIGNED_AND_VALID,
        };

        expect(hasValidAnonymousSignature(signatureIssues)).toBe(true);
    });

    it('should return false when thumbnail is signed', () => {
        const signatureIssues: SignatureIssues = {
            manifest: VERIFICATION_STATUS.SIGNED_AND_VALID,
            thumbnail: VERIFICATION_STATUS.SIGNED_AND_VALID,
            blocks: VERIFICATION_STATUS.NOT_SIGNED,
            passphrase: VERIFICATION_STATUS.SIGNED_AND_VALID,
        };

        expect(hasValidAnonymousSignature(signatureIssues)).toBe(false);
        expect(console.warn).toHaveBeenCalledWith(
            'thumbnail signature should not be signed in case of anonymous upload'
        );
    });

    it('should return false when blocks are signed', () => {
        const signatureIssues: SignatureIssues = {
            manifest: VERIFICATION_STATUS.SIGNED_AND_VALID,
            thumbnail: VERIFICATION_STATUS.NOT_SIGNED,
            blocks: VERIFICATION_STATUS.SIGNED_AND_VALID,
            passphrase: VERIFICATION_STATUS.SIGNED_AND_VALID,
        };

        expect(hasValidAnonymousSignature(signatureIssues)).toBe(false);
        expect(console.warn).toHaveBeenCalledWith('blocks signature should not be signed in case of anonymous upload');
    });

    it('should return false when non-thumbnail/blocks signatures are invalid', () => {
        const signatureIssues: SignatureIssues = {
            manifest: VERIFICATION_STATUS.SIGNED_AND_INVALID,
            thumbnail: VERIFICATION_STATUS.NOT_SIGNED,
            blocks: VERIFICATION_STATUS.NOT_SIGNED,
            passphrase: VERIFICATION_STATUS.SIGNED_AND_VALID,
        };

        expect(hasValidAnonymousSignature(signatureIssues)).toBe(false);
    });

    it('should return false when non-thumbnail/blocks signatures are not signed', () => {
        const signatureIssues: SignatureIssues = {
            manifest: VERIFICATION_STATUS.NOT_SIGNED,
            thumbnail: VERIFICATION_STATUS.NOT_SIGNED,
            blocks: VERIFICATION_STATUS.NOT_SIGNED,
            passphrase: VERIFICATION_STATUS.SIGNED_AND_VALID,
        };

        expect(hasValidAnonymousSignature(signatureIssues)).toBe(false);
    });

    it('should handle empty signature issues object', () => {
        const signatureIssues: SignatureIssues = {};

        expect(hasValidAnonymousSignature(signatureIssues)).toBe(true);
    });
});
