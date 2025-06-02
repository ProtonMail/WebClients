import { VERIFICATION_STATUS } from '@proton/crypto/lib/constants';
import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype';

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

        expect(hasValidAnonymousSignature(signatureIssues, { isFile: true, haveParentAccess: true })).toBe(true);
    });

    it('should return false when thumbnail is signed', () => {
        const signatureIssues: SignatureIssues = {
            manifest: VERIFICATION_STATUS.SIGNED_AND_VALID,
            thumbnail: VERIFICATION_STATUS.SIGNED_AND_VALID,
            blocks: VERIFICATION_STATUS.NOT_SIGNED,
            passphrase: VERIFICATION_STATUS.SIGNED_AND_VALID,
        };

        expect(hasValidAnonymousSignature(signatureIssues, { isFile: true, haveParentAccess: true })).toBe(false);
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

        expect(hasValidAnonymousSignature(signatureIssues, { isFile: true, haveParentAccess: true })).toBe(false);
        expect(console.warn).toHaveBeenCalledWith('blocks signature should not be signed in case of anonymous upload');
    });

    it('should return false when non-thumbnail/blocks signatures are invalid', () => {
        const signatureIssues: SignatureIssues = {
            manifest: VERIFICATION_STATUS.SIGNED_AND_INVALID,
            thumbnail: VERIFICATION_STATUS.NOT_SIGNED,
            blocks: VERIFICATION_STATUS.NOT_SIGNED,
            passphrase: VERIFICATION_STATUS.SIGNED_AND_VALID,
        };

        expect(hasValidAnonymousSignature(signatureIssues, { isFile: true, haveParentAccess: true })).toBe(false);
    });

    it('should return false when non-thumbnail/blocks signatures are not signed', () => {
        const signatureIssues: SignatureIssues = {
            manifest: VERIFICATION_STATUS.NOT_SIGNED,
            thumbnail: VERIFICATION_STATUS.NOT_SIGNED,
            blocks: VERIFICATION_STATUS.NOT_SIGNED,
            passphrase: VERIFICATION_STATUS.SIGNED_AND_VALID,
        };

        expect(hasValidAnonymousSignature(signatureIssues, { isFile: true, haveParentAccess: true })).toBe(false);
    });

    it('should return true for Proton document without signature issues', () => {
        expect(
            hasValidAnonymousSignature(undefined, {
                mimeType: PROTON_DOCS_DOCUMENT_MIMETYPE,
                isFile: true,
                haveParentAccess: true,
            })
        ).toBe(true);
    });

    it('should return true for non-file without signature issues', () => {
        expect(hasValidAnonymousSignature(undefined, { isFile: false, haveParentAccess: true })).toBe(true);
    });

    it('should return false for regular file without signature issues', () => {
        expect(
            hasValidAnonymousSignature(undefined, {
                mimeType: SupportedMimeTypes.jpg,
                isFile: true,
                haveParentAccess: true,
            })
        ).toBe(false);
        expect(console.warn).toHaveBeenCalledWith('Anonymous uploaded files should have thumbnail and blocks unsigned');
    });

    it('should return true when there are signature issues but no parent access', () => {
        const signatureIssues: SignatureIssues = {
            manifest: VERIFICATION_STATUS.SIGNED_AND_INVALID,
            thumbnail: VERIFICATION_STATUS.SIGNED_AND_VALID,
            blocks: VERIFICATION_STATUS.SIGNED_AND_VALID,
            passphrase: VERIFICATION_STATUS.NOT_SIGNED,
        };

        expect(hasValidAnonymousSignature(signatureIssues, { isFile: true, haveParentAccess: false })).toBe(true);
    });
});
