import type { PublicKeyReference } from '@proton/crypto';
import { PACKAGE_TYPE, SIGN } from '@proton/shared/lib/mail/mailSettings';

import type { CONTACT_MIME_TYPES } from '../../lib/constants';
import { MIME_TYPES, MIME_TYPES_MORE, PGP_SCHEMES, PGP_SCHEMES_MORE } from '../../lib/constants';
import type { MailSettings, SelfSend } from '../../lib/interfaces';
import { KT_VERIFICATION_STATUS } from '../../lib/interfaces';
import extractEncryptionPreferences, { ENCRYPTION_PREFERENCES_ERROR_TYPES } from '../../lib/mail/encryptionPreferences';

const getMockedPublicKey = (fingerprint: string, userID: string, version: 4 | 6 = 4): PublicKeyReference =>
    ({
        getFingerprint() {
            return fingerprint;
        },
        getUserIDs: () => [userID],
        getVersion: () => version,
    }) as PublicKeyReference;

const fakeKey1 = getMockedPublicKey('fakeKey1', '<user@pm.me>');
const pinnedFakeKey1 = getMockedPublicKey('fakeKey1', '<user@pm.me>');
const fakeKey2 = getMockedPublicKey('fakeKey2', '<user@tatoo.me>');
const pinnedFakeKey2 = getMockedPublicKey('fakeKey2', '<user@tatoo.me>');
const fakeKey3 = getMockedPublicKey('fakeKey3', '<user3@test.me>');
const pinnedFakeKey3 = getMockedPublicKey('fakeKey3', '<user3@test.me>');

describe('extractEncryptionPreferences for an internal user', () => {
    const ktVerificationResult = { status: KT_VERIFICATION_STATUS.VERIFIED_KEYS };
    const model = {
        emailAddress: 'user@pm.me',
        publicKeys: { apiKeys: [], pinnedKeys: [] },
        scheme: PGP_SCHEMES_MORE.GLOBAL_DEFAULT,
        mimeType: MIME_TYPES_MORE.AUTOMATIC,
        isInternalWithDisabledE2EEForMail: false,
        trustedFingerprints: new Set([]),
        encryptionCapableFingerprints: new Set([]),
        obsoleteFingerprints: new Set([]),
        compromisedFingerprints: new Set([]),
        primaryKeyFingerprints: new Set([]),
        isPGPExternal: false,
        isPGPInternal: true,
        isPGPExternalWithExternallyFetchedKeys: false,
        isPGPExternalWithoutExternallyFetchedKeys: false,
        pgpAddressDisabled: false,
        isContact: true,
        isContactSignatureVerified: true,
        contactSignatureTimestamp: new Date(0),
        ktVerificationResult,
    };
    const mailSettings = {
        Sign: SIGN.ENABLED,
        PGPScheme: PACKAGE_TYPE.SEND_PGP_MIME,
        DraftMIMEType: MIME_TYPES.DEFAULT,
    } as MailSettings;

    it('should extract the primary API key when the email address does not belong to any contact', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [] as PublicKeyReference[];
        const verifyingPinnedKeys = [] as PublicKeyReference[];
        const publicKeyModel = {
            ...model,
            isContact: false,
            isContactSignatureVerified: undefined,
            contactSignatureTimestamp: undefined,
            publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
            encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey3']),
            obsoleteFingerprints: new Set(['fakeKey3']),
            primaryKeyFingerprints: new Set(['fakeKey1']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            isInternalWithDisabledE2EEForMail: false,
            sendKey: fakeKey1,
            isSendKeyPinned: false,
            apiKeys,
            pinnedKeys,
            verifyingPinnedKeys,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: false,
            warnings: [],
            isContact: false,
            isContactSignatureVerified: undefined,
            contactSignatureTimestamp: undefined,
            emailAddressWarnings: undefined,
            ktVerificationResult,
        });
    });

    it('should extract the primary API key when there are no pinned keys', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [] as PublicKeyReference[];
        const verifyingPinnedKeys = [] as PublicKeyReference[];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
            encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey3']),
            obsoleteFingerprints: new Set(['fakeKey3']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            isInternalWithDisabledE2EEForMail: false,
            sendKey: fakeKey1,
            isSendKeyPinned: false,
            apiKeys,
            pinnedKeys,
            verifyingPinnedKeys,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: false,
            warnings: [],
            isContact: true,
            isContactSignatureVerified: true,
            contactSignatureTimestamp: new Date(0),
            emailAddressWarnings: undefined,
            ktVerificationResult,
        });
    });

    it('should pick the pinned key (and not the API one)', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey2, pinnedFakeKey1];
        const verifyingPinnedKeys = [pinnedFakeKey2];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
            trustedFingerprints: new Set(['fakeKey1', 'fakeKey2']),
            encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey3']),
            obsoleteFingerprints: new Set(['fakeKey3']),
            primaryKeyFingerprints: new Set(['fakeKey1']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            isInternalWithDisabledE2EEForMail: false,
            sendKey: pinnedFakeKey1,
            isSendKeyPinned: true,
            apiKeys,
            pinnedKeys,
            verifyingPinnedKeys,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: true,
            warnings: [],
            isContact: true,
            isContactSignatureVerified: true,
            contactSignatureTimestamp: new Date(0),
            emailAddressWarnings: undefined,
            ktVerificationResult,
        });
    });

    it('should give a warning for keyid mismatch', () => {
        const apiKeys = [fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey2];
        const verifyingPinnedKeys = [] as PublicKeyReference[];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
            trustedFingerprints: new Set(['fakeKey2']),
            encryptionCapableFingerprints: new Set(['fakeKey2', 'fakeKey3']),
            primaryKeyFingerprints: new Set(['fakeKey2']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result.warnings?.length).toEqual(1);
        expect(result.warnings![0]).toEqual(
            'Email address not found among user ids defined in sending key (user@tatoo.me)'
        );
    });

    it('should give an error when the API gave emailAddress errors', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey1];
        const verifyingPinnedKeys = [pinnedFakeKey1] as PublicKeyReference[];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
            encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey2', 'fakeKey3']),
            obsoleteFingerprints: new Set(['fakeKey1']),
            primaryKeyFingerprints: new Set(['fakeKey1']),
            emailAddressErrors: ['Recipient could not be found'],
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.EMAIL_ADDRESS_ERROR);
    });

    it('should give an error when there are no pinned keys and the primary key is not valid for sending', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys: [], verifyingPinnedKeys: [] },
            encryptionCapableFingerprints: new Set(['fakeKey2', 'fakeKey3']),
            compromisedFingerprints: new Set(['fakeKey1']),
            primaryKeyFingerprints: new Set(['fakeKey1']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_CANNOT_SEND);
    });

    it('should give an error when the preferred pinned key is not valid for sending', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey1];
        const verifyingPinnedKeys = [pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
            encryptionCapableFingerprints: new Set(['fakeKey2', 'fakeKey3']),
            obsoleteFingerprints: new Set(['fakeKey1']),
            primaryKeyFingerprints: new Set(['fakeKey1']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_CANNOT_SEND);
    });

    it('should give an error when the preferred pinned key is not among the keys returned by the API', () => {
        const apiKeys = [fakeKey1, fakeKey2];
        const pinnedKeys = [pinnedFakeKey3];
        const verifyingPinnedKeys = [pinnedFakeKey3];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
            encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey2']),
            trustedFingerprints: new Set(['fakeKey3']),
            primaryKeyFingerprints: new Set(['fakeKey1']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_NOT_PINNED);
    });

    it('should give an error if the API returned no keys', () => {
        const apiKeys = [] as PublicKeyReference[];
        const pinnedKeys = [pinnedFakeKey1];
        const verifyingPinnedKeys = [pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
            trustedFingerprints: new Set(['fakeKey1']),
            encryptionCapableFingerprints: new Set(['fakeKey1']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.INTERNAL_USER_NO_API_KEY);
    });

    it('should give an error if the API returned no keys valid for sending', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey1];
        const verifyingPinnedKeys = [] as PublicKeyReference[];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
            trustedFingerprints: new Set(['fakeKey1']),
            encryptionCapableFingerprints: new Set(['fakeKey3']),
            obsoleteFingerprints: new Set(['fakeKey3']),
            primaryKeyFingerprints: new Set(['fakeKey1']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_CANNOT_SEND);
    });

    it('should give an error if there are pinned keys but the contact signature could not be verified', () => {
        const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
        const pinnedKeys = [pinnedFakeKey1];
        const verifyingPinnedKeys = [pinnedFakeKey1];
        const publicKeyModel = {
            ...model,
            isContactSignatureVerified: false,
            publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
            encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey2', 'fakeKey3']),
            primaryKeyFingerprints: new Set(['fakeKey1']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.CONTACT_SIGNATURE_NOT_VERIFIED);
    });

    it('should give an error if key transparency returned an error', () => {
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys: [], pinnedKeys: [], verifyingPinnedKeys: [] },
            emailAddressErrors: ['Key verification error'],
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);
        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.EMAIL_ADDRESS_ERROR);
    });

    it('should give an error if key transparency returned an error, and ignore pinned keys', () => {
        const pinnedKeys = [pinnedFakeKey2, pinnedFakeKey1];
        const verifyingPinnedKeys = [pinnedFakeKey2];
        const publicKeyModel = {
            ...model,
            publicKeys: { apiKeys: [], pinnedKeys, verifyingPinnedKeys },
            trustedFingerprints: new Set(['fakeKey1', 'fakeKey2']),
            emailAddressErrors: ['Key verification error'],
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);
        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.EMAIL_ADDRESS_ERROR);
    });
});

const testExtractEncryptionPreferencesWithWKD = (encrypt: boolean) =>
    describe(`extractEncryptionPreferences for an external user with WKD keys (encrypt: ${encrypt})`, () => {
        const ktVerificationResult = { status: KT_VERIFICATION_STATUS.UNVERIFIED_KEYS };
        const model = {
            encrypt,
            emailAddress: 'user@pm.me',
            publicKeys: { apiKeys: [], pinnedKeys: [], verifyingPinnedKeys: [] },
            scheme: PGP_SCHEMES.PGP_INLINE,
            mimeType: MIME_TYPES.PLAINTEXT as CONTACT_MIME_TYPES,
            isInternalWithDisabledE2EEForMail: false,
            trustedFingerprints: new Set([]),
            encryptionCapableFingerprints: new Set([]),
            obsoleteFingerprints: new Set([]),
            compromisedFingerprints: new Set([]),
            primaryKeyFingerprints: new Set([]),
            isPGPExternal: true,
            isPGPInternal: false,
            isPGPExternalWithExternallyFetchedKeys: true,
            isPGPExternalWithoutExternallyFetchedKeys: false,
            pgpAddressDisabled: false,
            isContact: true,
            isContactSignatureVerified: true,
            contactSignatureTimestamp: new Date(0),
            ktVerificationResult,
        };
        const mailSettings = {
            Sign: SIGN.DISABLED,
            PGPScheme: PACKAGE_TYPE.SEND_PGP_MIME,
            DraftMIMEType: MIME_TYPES.DEFAULT,
        } as MailSettings;

        it('should extract the primary API key when the email address does not belong to any contact', () => {
            const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
            const pinnedKeys = [] as PublicKeyReference[];
            const verifyingPinnedKeys = [] as PublicKeyReference[];
            const publicKeyModel = {
                ...model,
                isContact: false,
                isContactSignatureVerified: undefined,
                contactSignatureTimestamp: undefined,
                publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
                encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey3']),
                // no obsolete or primary key fingerprints for WKD keys
            };
            const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

            expect(result).toEqual({
                encrypt,
                sign: encrypt,
                mimeType: MIME_TYPES.PLAINTEXT,
                scheme: PGP_SCHEMES.PGP_INLINE,
                isInternalWithDisabledE2EEForMail: false,
                sendKey: fakeKey1,
                isSendKeyPinned: false,
                apiKeys,
                pinnedKeys,
                verifyingPinnedKeys,
                isInternal: false,
                hasApiKeys: true,
                hasPinnedKeys: false,
                warnings: [],
                isContact: false,
                isContactSignatureVerified: undefined,
                emailAddressWarnings: undefined,
                contactSignatureTimestamp: undefined,
                ktVerificationResult,
            });
        });

        it('should extract the primary API key when there are no pinned keys', () => {
            const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
            const pinnedKeys = [] as PublicKeyReference[];
            const verifyingPinnedKeys = [] as PublicKeyReference[];
            const publicKeyModel = {
                ...model,
                publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
                encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey3']),
                // no obsolete or primary key fingerprints for WKD keys
            };
            const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

            expect(result).toEqual({
                encrypt,
                sign: encrypt,
                mimeType: MIME_TYPES.PLAINTEXT,
                scheme: PGP_SCHEMES.PGP_INLINE,
                isInternalWithDisabledE2EEForMail: false,
                sendKey: fakeKey1,
                isSendKeyPinned: false,
                apiKeys,
                pinnedKeys,
                verifyingPinnedKeys,
                isInternal: false,
                hasApiKeys: true,
                hasPinnedKeys: false,
                warnings: [],
                isContact: true,
                isContactSignatureVerified: true,
                contactSignatureTimestamp: new Date(0),
                emailAddressWarnings: undefined,
                ktVerificationResult,
            });
        });

        it('should pick the pinned key (and not the API one)', () => {
            const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
            const pinnedKeys = [pinnedFakeKey2, pinnedFakeKey1];
            const verifyingPinnedKeys = [pinnedFakeKey1];
            const publicKeyModel = {
                ...model,
                publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
                trustedFingerprints: new Set(['fakeKey1', 'fakeKey2']),
                encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey3']),
                // no obsolete or primary key fingerprints for WKD keys
            };
            const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

            expect(result).toEqual({
                encrypt,
                sign: encrypt,
                mimeType: MIME_TYPES.PLAINTEXT,
                scheme: PGP_SCHEMES.PGP_INLINE,
                isInternalWithDisabledE2EEForMail: false,
                sendKey: pinnedFakeKey1,
                isSendKeyPinned: true,
                apiKeys,
                pinnedKeys,
                verifyingPinnedKeys,
                isInternal: false,
                hasApiKeys: true,
                hasPinnedKeys: true,
                warnings: [],
                isContact: true,
                isContactSignatureVerified: true,
                contactSignatureTimestamp: new Date(0),
                emailAddressWarnings: undefined,
                ktVerificationResult,
            });
        });

        it('should give a warning for keyid mismatch', () => {
            const apiKeys = [fakeKey2, fakeKey3];
            const pinnedKeys = [pinnedFakeKey2];
            const verifyingPinnedKeys = [pinnedFakeKey2];
            const publicKeyModel = {
                ...model,
                publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
                trustedFingerprints: new Set(['fakeKey2']),
                encryptionCapableFingerprints: new Set(['fakeKey2', 'fakeKey3']),
                // no obsolete or primary key fingerprints for WKD keys
            };
            const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

            expect(result.warnings?.length).toEqual(1);
        });

        it('should give an error when the API gave emailAddress errors', () => {
            const publicKeyModel = {
                ...model,
                publicKeys: {
                    apiKeys: [fakeKey1, fakeKey2, fakeKey3],
                    pinnedKeys: [pinnedFakeKey1],
                    verifyingPinnedKeys: [],
                },
                encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey2', 'fakeKey3']),
                // no obsolete or primary key fingerprints for WKD keys
                emailAddressErrors: ['Recipient could not be found'],
            };
            const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

            expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.EMAIL_ADDRESS_ERROR);
        });

        it('should give an error when the preferred pinned key is not valid for sending', () => {
            const publicKeyModel = {
                ...model,
                publicKeys: {
                    apiKeys: [fakeKey1, fakeKey2, fakeKey3],
                    pinnedKeys: [pinnedFakeKey1],
                    verifyingPinnedKeys: [pinnedFakeKey1],
                },
                encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey2', 'fakeKey3']),
                // no obsolete or primary key fingerprints for WKD keys
            };
            const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

            expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_NOT_PINNED);
        });

        it('should give an error when the preferred pinned key is not among the keys returned by the API', () => {
            const publicKeyModel = {
                ...model,
                publicKeys: {
                    apiKeys: [fakeKey1, fakeKey2],
                    pinnedKeys: [pinnedFakeKey3],
                    verifyingPinnedKeys: [pinnedFakeKey3],
                },
                encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey2', 'fakeKey3']),
                trustedFingerprints: new Set(['fakeKey3']),
                // no obsolete or primary key fingerprints for WKD keys
            };
            const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

            expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_NOT_PINNED);
        });

        it('should give an error if the API returned no keys valid for sending', () => {
            const publicKeyModel = {
                ...model,
                publicKeys: {
                    apiKeys: [fakeKey1, fakeKey2, fakeKey3],
                    pinnedKeys: [pinnedFakeKey1],
                    verifyingPinnedKeys: [],
                },
                trustedFingerprints: new Set(['fakeKey1']),
                encryptionCapableFingerprints: new Set([]),
                // no obsolete or primary key fingerprints for WKD keys
            };
            const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

            expect(result?.error?.type).toEqual(
                ENCRYPTION_PREFERENCES_ERROR_TYPES.EXTERNAL_USER_NO_VALID_EXTERNALLY_FETCHED_KEY
            );
        });

        it('should give an error if there are pinned keys but the contact signature could not be verified', () => {
            const apiKeys = [fakeKey1, fakeKey2, fakeKey3];
            const pinnedKeys = [pinnedFakeKey1];
            const verifyingPinnedKeys = [pinnedFakeKey1];
            const publicKeyModel = {
                ...model,
                isContactSignatureVerified: false,
                publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
                encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey2', 'fakeKey3']),
            };
            const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

            expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.CONTACT_SIGNATURE_NOT_VERIFIED);
        });
    });

testExtractEncryptionPreferencesWithWKD(true);
testExtractEncryptionPreferencesWithWKD(false);

describe('extractEncryptionPreferences for an external user without WKD keys', () => {
    const ktVerificationResult = { status: KT_VERIFICATION_STATUS.UNVERIFIED_KEYS };
    const model = {
        emailAddress: 'user@tatoo.me',
        publicKeys: { apiKeys: [], pinnedKeys: [], verifyingPinnedKeys: [] },
        encrypt: false,
        sign: false,
        scheme: PGP_SCHEMES_MORE.GLOBAL_DEFAULT,
        mimeType: MIME_TYPES_MORE.AUTOMATIC,
        isInternalWithDisabledE2EEForMail: false,
        trustedFingerprints: new Set([]),
        encryptionCapableFingerprints: new Set([]),
        obsoleteFingerprints: new Set([]),
        compromisedFingerprints: new Set([]),
        primaryKeyFingerprints: new Set([]),
        isPGPExternal: true,
        isPGPInternal: false,
        isPGPExternalWithExternallyFetchedKeys: false,
        isPGPExternalWithoutExternallyFetchedKeys: true,
        pgpAddressDisabled: false,
        isContact: true,
        isContactSignatureVerified: true,
        contactSignatureTimestamp: new Date(0),
        ktVerificationResult,
    };
    const mailSettings = {
        Sign: SIGN.ENABLED,
        PGPScheme: PACKAGE_TYPE.SEND_PGP_MIME,
        DraftMIMEType: MIME_TYPES.PLAINTEXT,
    } as MailSettings;

    it('should take into account the mail Settings', () => {
        const modelWithoutSign = { ...model, encrypt: undefined, sign: undefined };
        const result = extractEncryptionPreferences(modelWithoutSign, mailSettings);

        expect(result).toEqual({
            encrypt: false,
            sign: true,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            isInternalWithDisabledE2EEForMail: false,
            apiKeys: [],
            pinnedKeys: [],
            verifyingPinnedKeys: [],
            isInternal: false,
            hasApiKeys: false,
            hasPinnedKeys: false,
            isContact: true,
            isContactSignatureVerified: true,
            contactSignatureTimestamp: new Date(0),
            emailAddressWarnings: undefined,
            ktVerificationResult,
        });
    });

    it('should pick no key when the email address does not belong to any contact', () => {
        const result = extractEncryptionPreferences(
            {
                ...model,
                isContact: false,
                isContactSignatureVerified: undefined,
                contactSignatureTimestamp: undefined,
            },
            mailSettings
        );

        expect(result).toEqual({
            encrypt: false,
            sign: false,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            isInternalWithDisabledE2EEForMail: false,
            apiKeys: [],
            pinnedKeys: [],
            verifyingPinnedKeys: [],
            isInternal: false,
            hasApiKeys: false,
            hasPinnedKeys: false,
            isContact: false,
            isContactSignatureVerified: undefined,
            contactSignatureTimestamp: undefined,
            emailAddressWarnings: undefined,
            ktVerificationResult,
        });
    });

    it('should pick no key when there are no pinned keys', () => {
        const result = extractEncryptionPreferences(model, mailSettings);

        expect(result).toEqual({
            encrypt: false,
            sign: false,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            isInternalWithDisabledE2EEForMail: false,
            apiKeys: [],
            pinnedKeys: [],
            verifyingPinnedKeys: [],
            isInternal: false,
            hasApiKeys: false,
            hasPinnedKeys: false,
            isContact: true,
            isContactSignatureVerified: true,
            contactSignatureTimestamp: new Date(0),
            emailAddressWarnings: undefined,
            ktVerificationResult,
        });
    });

    it('should pick the first pinned key', () => {
        const apiKeys = [] as PublicKeyReference[];
        const pinnedKeys = [pinnedFakeKey2, pinnedFakeKey3];
        const verifyingPinnedKeys = [pinnedFakeKey2, pinnedFakeKey3];
        const publicKeyModel = {
            ...model,
            encrypt: true,
            sign: true,
            publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
            trustedFingerprints: new Set(['fakeKey2', 'fakeKey3']),
            encryptionCapableFingerprints: new Set(['fakeKey2', 'fakeKey3']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            isInternalWithDisabledE2EEForMail: false,
            sendKey: pinnedFakeKey2,
            isSendKeyPinned: true,
            apiKeys,
            pinnedKeys,
            verifyingPinnedKeys,
            isInternal: false,
            hasApiKeys: false,
            hasPinnedKeys: true,
            warnings: [],
            isContact: true,
            isContactSignatureVerified: true,
            contactSignatureTimestamp: new Date(0),
            emailAddressWarnings: undefined,
            ktVerificationResult,
        });
    });

    it('should give a warning for keyid mismatch', () => {
        const publicKeyModel = {
            ...model,
            encrypt: true,
            sign: true,
            publicKeys: { apiKeys: [], pinnedKeys: [pinnedFakeKey1], verifyingPinnedKeys: [] },
            trustedFingerprints: new Set(['fakeKey1']),
            encryptionCapableFingerprints: new Set(['fakeKey1']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result.warnings?.length).toEqual(1);
    });

    it('should give an error when the preferred pinned key is not valid for sending', () => {
        const publicKeyModel = {
            ...model,
            encrypt: true,
            sign: true,
            publicKeys: {
                apiKeys: [],
                pinnedKeys: [pinnedFakeKey2, pinnedFakeKey1],
                verifyingPinnedKeys: [pinnedFakeKey1],
            },
            encryptionCapableFingerprints: new Set([]),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.EXTERNAL_USER_NO_VALID_PINNED_KEY);
    });

    it('should give an error if there are pinned keys but the contact signature could not be verified', () => {
        const publicKeyModel = {
            ...model,
            isContactSignatureVerified: false,
            publicKeys: {
                apiKeys: [],
                pinnedKeys: [pinnedFakeKey2, pinnedFakeKey1],
                verifyingPinnedKeys: [pinnedFakeKey2],
            },
            encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey2']),
        };
        const result = extractEncryptionPreferences(publicKeyModel, mailSettings);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.CONTACT_SIGNATURE_NOT_VERIFIED);
    });
});

describe('extractEncryptionPreferences for an own address', () => {
    const apiKeys = [fakeKey1, fakeKey2];
    const pinnedKeys = [] as PublicKeyReference[];
    const verifyingPinnedKeys = [] as PublicKeyReference[];
    const ktVerificationResult = { status: KT_VERIFICATION_STATUS.VERIFIED_KEYS };
    const model = {
        emailAddress: 'user@pm.me',
        publicKeys: { apiKeys, pinnedKeys, verifyingPinnedKeys },
        mimeType: MIME_TYPES_MORE.AUTOMATIC,
        scheme: PGP_SCHEMES_MORE.GLOBAL_DEFAULT,
        isInternalWithDisabledE2EEForMail: false,
        trustedFingerprints: new Set([]),
        encryptionCapableFingerprints: new Set(['fakeKey1', 'fakeKey2']),
        obsoleteFingerprints: new Set([]),
        compromisedFingerprints: new Set([]),
        primaryKeyFingerprints: new Set(['fakeKey1']),
        isPGPExternal: false,
        isPGPInternal: true,
        isPGPExternalWithExternallyFetchedKeys: false,
        isPGPExternalWithoutExternallyFetchedKeys: false,
        pgpAddressDisabled: false,
        isContact: false,
        emailAddressWarnings: undefined,
        ktVerificationResult,
    };
    const mailSettings = {
        Sign: SIGN.ENABLED,
        PGPScheme: PACKAGE_TYPE.SEND_PGP_MIME,
        DraftMIMEType: MIME_TYPES.PLAINTEXT,
    } as MailSettings;

    it('should not pick the public key from the keys in selfSend.address', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 1,
                Receive: 1,
            },
            publicKey: pinnedFakeKey1,
            canSend: true,
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result).toEqual({
            encrypt: true,
            sign: true,
            mimeType: MIME_TYPES_MORE.AUTOMATIC,
            scheme: PGP_SCHEMES.PGP_MIME,
            isInternalWithDisabledE2EEForMail: false,
            sendKey: pinnedFakeKey1,
            isSendKeyPinned: false,
            apiKeys,
            pinnedKeys,
            verifyingPinnedKeys,
            isInternal: true,
            hasApiKeys: true,
            hasPinnedKeys: false,
            warnings: [],
            isContact: false,
            isContactSignatureVerified: undefined,
            contactSignatureTimestamp: undefined,
            emailAddressWarnings: undefined,
            ktVerificationResult,
        });
    });

    it('should give a warning for keyid mismatch', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 1,
                Receive: 1,
            },
            publicKey: pinnedFakeKey2,
            canSend: true,
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result.warnings?.length).toEqual(1);
    });

    it('should give an error when the address is disabled', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 1,
                Receive: 0,
            },
            publicKey: pinnedFakeKey1,
            canSend: true,
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.INTERNAL_USER_DISABLED);
    });

    it('should give an error when the API returned no keys for the address', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 0,
                Receive: 1,
            },
            publicKey: pinnedFakeKey1,
            canSend: true,
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.INTERNAL_USER_NO_API_KEY);
    });

    it('should give an error if the primary key is compromised', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 0,
                Receive: 1,
            },
            publicKey: pinnedFakeKey1,
            canSend: false,
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.INTERNAL_USER_NO_API_KEY);
    });

    it('should give an error when no public key (from the decypted private key) was received', () => {
        const selfSend: SelfSend = {
            address: {
                HasKeys: 1,
                Receive: 1,
            },
        } as any;
        const result = extractEncryptionPreferences(model, mailSettings, selfSend);

        expect(result?.error?.type).toEqual(ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_CANNOT_SEND);
    });
});
