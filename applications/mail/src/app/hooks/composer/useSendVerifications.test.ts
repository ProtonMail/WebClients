import { PGP_SCHEMES, MIME_TYPES, MIME_TYPES_MORE, PACKAGE_TYPE } from 'proton-shared/lib/constants';
import getSendPreferences from 'proton-shared/lib/mail/send/getSendPreferences';
import { EncryptionPreferences } from 'proton-shared/lib/mail/encryptionPreferences';
import { useSendVerifications } from './useSendVerifications';
import { renderHook, clearAll } from '../../helpers/test/helper';
import { SendInfo } from '../../models/crypto';

const createMessage: (emailAddress: string) => {} = (emailAddress) => ({
    data: {
        ToList: [{ Address: emailAddress, Name: 'test' }],
        CCList: [],
        BCCList: [],
    },
});

const mockEncryptionPreferences: { [email: string]: EncryptionPreferences } = {
    'internal.pinned@test.email': {
        sign: true,
        encrypt: true,
        isSendKeyPinned: true,
        isContactSignatureVerified: true,
        contactSignatureTimestamp: new Date(),
        // irrelevant fields
        scheme: PGP_SCHEMES.PGP_MIME,
        mimeType: MIME_TYPES_MORE.AUTOMATIC,
        apiKeys: [],
        pinnedKeys: [],
        isInternal: true,
        hasApiKeys: true,
        hasPinnedKeys: true,
        isContact: true,
    },

    'internal.deleted@test.email': {
        sign: true,
        encrypt: true,
        isSendKeyPinned: false,
        isContactSignatureVerified: undefined,
        contactSignatureTimestamp: undefined,
        // irrelevant fields
        scheme: PGP_SCHEMES.PGP_MIME,
        mimeType: MIME_TYPES_MORE.AUTOMATIC,
        apiKeys: [],
        pinnedKeys: [],
        isInternal: true,
        hasApiKeys: true,
        hasPinnedKeys: false,
        isContact: true,
    },

    'internal.unpinned@test.email': {
        sign: true,
        encrypt: true,
        isSendKeyPinned: false,
        isContactSignatureVerified: true,
        contactSignatureTimestamp: new Date(),
        // irrelevant fields
        scheme: PGP_SCHEMES.PGP_MIME,
        mimeType: MIME_TYPES_MORE.AUTOMATIC,
        apiKeys: [],
        pinnedKeys: [],
        isInternal: true,
        hasApiKeys: true,
        hasPinnedKeys: false,
        isContact: true,
    },

    'external.encryptsign@test.email': {
        sign: true,
        encrypt: true,
        isSendKeyPinned: true,
        isContactSignatureVerified: true,
        contactSignatureTimestamp: new Date(),
        // irrelevant fields
        scheme: PGP_SCHEMES.PGP_MIME,
        mimeType: MIME_TYPES_MORE.AUTOMATIC,
        apiKeys: [],
        pinnedKeys: [],
        isInternal: false,
        hasApiKeys: false,
        hasPinnedKeys: true,
        isContact: true,
    },

    'external.deleted@test.email': {
        sign: true,
        encrypt: false,
        isSendKeyPinned: false,
        isContactSignatureVerified: undefined,
        contactSignatureTimestamp: undefined,
        // irrelevant fields
        scheme: PGP_SCHEMES.PGP_MIME,
        mimeType: MIME_TYPES_MORE.AUTOMATIC,
        apiKeys: [],
        pinnedKeys: [],
        isInternal: false,
        hasApiKeys: false,
        hasPinnedKeys: false,
        isContact: true,
    },

    'external.signonly@test.email': {
        sign: true,
        encrypt: false,
        isSendKeyPinned: true,
        isContactSignatureVerified: true,
        contactSignatureTimestamp: new Date(),
        // irrelevant fields
        scheme: PGP_SCHEMES.PGP_MIME,
        mimeType: MIME_TYPES_MORE.AUTOMATIC,
        apiKeys: [],
        pinnedKeys: [],
        isInternal: false,
        hasApiKeys: false,
        hasPinnedKeys: true,
        isContact: true,
    },
};

jest.mock('react-components/hooks/useGetEncryptionPreferences.ts', () => {
    const useGetEncryptionPreferences = () => {
        const getEncryptionPreferences: (emailAddress: string) => EncryptionPreferences = (emailAddress) =>
            mockEncryptionPreferences[emailAddress];
        return getEncryptionPreferences;
    };
    return useGetEncryptionPreferences;
});

const mockCreateModalSpy = jest.fn(({ props }) => props.onSubmit());
jest.mock('react-components/hooks/useModals.ts', () => {
    const useModals = () => ({
        createModal: mockCreateModalSpy,
    });
    return useModals;
});

describe('useSendVerifications', () => {
    const setup = () => {
        return renderHook(() => useSendVerifications());
    };

    afterEach(() => {
        jest.clearAllMocks();
        clearAll();
    });

    describe('extended verifications of last-minute preferences', () => {
        it('should warn user on deletion of contact with pinned keys (internal)', async () => {
            const recipient = 'internal.deleted@test.email';
            const cachedPreferences: SendInfo = {
                sendPreferences: {
                    encrypt: true,
                    sign: true,
                    isPublicKeyPinned: true,
                    hasApiKeys: true,
                    hasPinnedKeys: true,
                    pgpScheme: PACKAGE_TYPE.SEND_PM,
                    mimeType: MIME_TYPES.DEFAULT,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(),
                },
                loading: false,
                emailValidation: true,
            };
            const { extendedVerifications } = setup().result.current;
            const message = createMessage(recipient);
            const mapSendInfo = { [recipient]: cachedPreferences };
            const { mapSendPrefs } = await extendedVerifications(message, mapSendInfo);

            expect(mockCreateModalSpy).toHaveBeenCalled(); // user was warned
            const lastMinutePreferences = mockEncryptionPreferences[recipient];
            expect(mapSendPrefs[recipient]).toStrictEqual(getSendPreferences(lastMinutePreferences, message));
            // sanity checks
            expect(mapSendPrefs[recipient].encrypt).toBe(true);
            expect(mapSendPrefs[recipient].isPublicKeyPinned).toBe(false);
        });

        it('should warn user on deletion of contact with pinned keys (external)', async () => {
            const recipient = 'external.deleted@test.email';
            const cachedPreferences: SendInfo = {
                sendPreferences: {
                    encrypt: true,
                    sign: true,
                    isPublicKeyPinned: true,
                    hasApiKeys: true,
                    hasPinnedKeys: true,
                    pgpScheme: PACKAGE_TYPE.SEND_PM,
                    mimeType: MIME_TYPES.DEFAULT,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(),
                },
                loading: false,
                emailValidation: true,
            };
            const { extendedVerifications } = setup().result.current;
            const message = createMessage(recipient);
            const mapSendInfo = { [recipient]: cachedPreferences };
            const { mapSendPrefs } = await extendedVerifications(message, mapSendInfo);

            expect(mockCreateModalSpy).toHaveBeenCalled(); // user was warned
            const lastMinutePreferences = mockEncryptionPreferences[recipient];
            expect(mapSendPrefs[recipient]).toStrictEqual(getSendPreferences(lastMinutePreferences, message));
            // sanity checks
            expect(mapSendPrefs[recipient].encrypt).toBe(false);
            expect(mapSendPrefs[recipient].isPublicKeyPinned).toBe(false);
        });

        it('should silently send with last-minute prefs on contact deletion with encryption disabled (external)', async () => {
            const recipient = 'external.deleted@test.email';
            const cachedPreferences: SendInfo = {
                sendPreferences: {
                    sign: true,
                    encrypt: false,
                    isPublicKeyPinned: true,
                    hasApiKeys: false,
                    hasPinnedKeys: true,
                    pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                    mimeType: MIME_TYPES.MIME,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(),
                },
                loading: false,
                emailValidation: true,
            };
            const { extendedVerifications } = setup().result.current;
            const message = createMessage(recipient);
            const mapSendInfo = { [recipient]: cachedPreferences };
            const { mapSendPrefs } = await extendedVerifications(message, mapSendInfo);

            expect(mockCreateModalSpy).not.toHaveBeenCalled(); // user was not warned
            const lastMinutePreferences = mockEncryptionPreferences[recipient];
            expect(mapSendPrefs[recipient]).toStrictEqual(getSendPreferences(lastMinutePreferences, message));
            // sanity checks
            expect(mapSendPrefs[recipient].encrypt).toBe(false);
            expect(mapSendPrefs[recipient].isPublicKeyPinned).toBe(false);
        });

        it('should silently send with last-minute prefs on last-minute unpinning via new signature (internal)', async () => {
            const recipient = 'internal.unpinned@test.email';
            const lastMinutePreferences = mockEncryptionPreferences[recipient];
            const cachedPreferences: SendInfo = {
                sendPreferences: {
                    sign: true,
                    encrypt: true,
                    isPublicKeyPinned: true,
                    hasApiKeys: true,
                    hasPinnedKeys: true,
                    pgpScheme: PACKAGE_TYPE.SEND_PM,
                    mimeType: MIME_TYPES.DEFAULT,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(+lastMinutePreferences.contactSignatureTimestamp! - 1),
                },
                loading: false,
                emailValidation: true,
            };
            const { extendedVerifications } = setup().result.current;
            const message = createMessage(recipient);
            const mapSendInfo = { [recipient]: cachedPreferences };
            const { mapSendPrefs } = await extendedVerifications(message, mapSendInfo);

            expect(mockCreateModalSpy).not.toHaveBeenCalled(); // user was not warned
            expect(mapSendPrefs[recipient]).toStrictEqual(getSendPreferences(lastMinutePreferences, message));
            // sanity checks
            expect(mapSendPrefs[recipient].encrypt).toBe(true);
            expect(mapSendPrefs[recipient].isPublicKeyPinned).toBe(false);
        });

        it('should silently send with last-minute prefs on last-minute encryption disabling via new signature (external)', async () => {
            const recipient = 'external.signonly@test.email';
            const lastMinutePreferences = mockEncryptionPreferences[recipient];
            const cachedPreferences: SendInfo = {
                sendPreferences: {
                    sign: true,
                    encrypt: true,
                    isPublicKeyPinned: true,
                    hasApiKeys: false,
                    hasPinnedKeys: true,
                    pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                    mimeType: MIME_TYPES.MIME,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(+lastMinutePreferences.contactSignatureTimestamp! - 1),
                },
                loading: false,
                emailValidation: true,
            };
            const { extendedVerifications } = setup().result.current;
            const message = createMessage(recipient);
            const mapSendInfo = { [recipient]: cachedPreferences };
            const { mapSendPrefs } = await extendedVerifications(message, mapSendInfo);

            expect(mockCreateModalSpy).not.toHaveBeenCalled(); // user was not warned
            expect(mapSendPrefs[recipient]).toStrictEqual(getSendPreferences(lastMinutePreferences, message));
            // sanity checks
            expect(mapSendPrefs[recipient].encrypt).toBe(false);
            expect(mapSendPrefs[recipient].isPublicKeyPinned).toBe(true);
        });

        it('should silently send with cached prefs on last-minute unpinning via old signature (internal)', async () => {
            const recipient = 'internal.unpinned@test.email';
            const lastMinutePreferences = mockEncryptionPreferences[recipient];
            const cachedPreferences: SendInfo = {
                sendPreferences: {
                    sign: true,
                    encrypt: true,
                    isPublicKeyPinned: true,
                    hasApiKeys: true,
                    hasPinnedKeys: true,
                    pgpScheme: PACKAGE_TYPE.SEND_PM,
                    mimeType: MIME_TYPES.DEFAULT,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(+lastMinutePreferences.contactSignatureTimestamp! + 1),
                },
                loading: false,
                emailValidation: true,
            };
            const { extendedVerifications } = setup().result.current;
            const message = createMessage(recipient);
            const mapSendInfo = { [recipient]: cachedPreferences };
            const { mapSendPrefs } = await extendedVerifications(message, mapSendInfo);

            expect(mockCreateModalSpy).not.toHaveBeenCalled(); // user was not warned
            expect(mapSendPrefs[recipient]).toStrictEqual(cachedPreferences.sendPreferences);
            // sanity checks
            expect(mapSendPrefs[recipient].encrypt).toBe(true);
            expect(mapSendPrefs[recipient].isPublicKeyPinned).toBe(true);
        });

        it('should silently send with cached prefs on last-minute encryption disabling via old signature (external)', async () => {
            const recipient = 'external.signonly@test.email';
            const lastMinutePreferences = mockEncryptionPreferences[recipient];
            const cachedPreferences: SendInfo = {
                sendPreferences: {
                    sign: true,
                    encrypt: true,
                    isPublicKeyPinned: true,
                    hasApiKeys: false,
                    hasPinnedKeys: true,
                    pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                    mimeType: MIME_TYPES.DEFAULT,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(+lastMinutePreferences.contactSignatureTimestamp! + 1),
                },
                loading: false,
                emailValidation: true,
            };
            const { extendedVerifications } = setup().result.current;
            const message = createMessage(recipient);
            const mapSendInfo = { [recipient]: cachedPreferences };
            const { mapSendPrefs } = await extendedVerifications(message, mapSendInfo);

            expect(mockCreateModalSpy).not.toHaveBeenCalled(); // user was not warned
            expect(mapSendPrefs[recipient]).toStrictEqual(cachedPreferences.sendPreferences);
            // sanity checks
            expect(mapSendPrefs[recipient].encrypt).toBe(true);
            expect(mapSendPrefs[recipient].isPublicKeyPinned).toBe(true);
        });

        it('should silently send with last-minute prefs on last-minute key pinning (internal)', async () => {
            const recipient = 'internal.pinned@test.email';
            const lastMinutePreferences = mockEncryptionPreferences[recipient];
            const cachedPreferences: SendInfo = {
                sendPreferences: {
                    sign: true,
                    encrypt: true,
                    isPublicKeyPinned: false,
                    hasApiKeys: true,
                    hasPinnedKeys: false,
                    pgpScheme: PACKAGE_TYPE.SEND_PM,
                    mimeType: MIME_TYPES.DEFAULT,
                },
                contactSignatureInfo: {
                    isVerified: undefined,
                    creationTime: undefined,
                },
                loading: false,
                emailValidation: true,
            };
            const { extendedVerifications } = setup().result.current;
            const message = createMessage(recipient);
            const mapSendInfo = { [recipient]: cachedPreferences };
            const { mapSendPrefs } = await extendedVerifications(message, mapSendInfo);

            expect(mockCreateModalSpy).not.toHaveBeenCalled(); // user was not warned
            expect(mapSendPrefs[recipient]).toStrictEqual(getSendPreferences(lastMinutePreferences, message));
            // sanity checks
            expect(mapSendPrefs[recipient].encrypt).toBe(true);
            expect(mapSendPrefs[recipient].isPublicKeyPinned).toBe(true);
        });

        it('should silently send with last-minute prefs on encryption enabled last-minute (external)', async () => {
            const recipient = 'external.encryptsign@test.email';
            const lastMinutePreferences = mockEncryptionPreferences[recipient];
            const cachedPreferences: SendInfo = {
                sendPreferences: {
                    sign: true,
                    encrypt: false,
                    isPublicKeyPinned: true,
                    hasApiKeys: false,
                    hasPinnedKeys: true,
                    pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                    mimeType: MIME_TYPES.MIME,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(+lastMinutePreferences.contactSignatureTimestamp! - 1),
                },
                loading: false,
                emailValidation: true,
            };
            const { extendedVerifications } = setup().result.current;
            const message = createMessage(recipient);
            const mapSendInfo = { [recipient]: cachedPreferences };
            const { mapSendPrefs } = await extendedVerifications(message, mapSendInfo);

            expect(mockCreateModalSpy).not.toHaveBeenCalled(); // user was not warned
            expect(mapSendPrefs[recipient]).toStrictEqual(getSendPreferences(lastMinutePreferences, message));
            // sanity checks
            expect(mapSendPrefs[recipient].encrypt).toBe(true);
            expect(mapSendPrefs[recipient].isPublicKeyPinned).toBe(true);
        });

        it('should silently send with last-minute prefs for non-contacts (internal)', async () => {
            const recipient = 'internal.deleted@test.email';
            const lastMinutePreferences = mockEncryptionPreferences[recipient];
            const cachedPreferences: SendInfo = {
                sendPreferences: {
                    sign: true,
                    encrypt: true,
                    isPublicKeyPinned: false,
                    hasApiKeys: true,
                    hasPinnedKeys: false,
                    pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                    mimeType: MIME_TYPES.MIME,
                },
                contactSignatureInfo: {
                    isVerified: undefined,
                    creationTime: undefined,
                },
                loading: false,
                emailValidation: true,
            };
            const { extendedVerifications } = setup().result.current;
            const message = createMessage(recipient);
            const mapSendInfo = { [recipient]: cachedPreferences };
            const { mapSendPrefs } = await extendedVerifications(message, mapSendInfo);

            expect(mockCreateModalSpy).not.toHaveBeenCalled(); // user was not warned
            expect(mapSendPrefs[recipient]).toStrictEqual(getSendPreferences(lastMinutePreferences, message));
            // sanity checks
            expect(mapSendPrefs[recipient].encrypt).toBe(true);
            expect(mapSendPrefs[recipient].isPublicKeyPinned).toBe(false);
        });

        it('should silently send with last-minute prefs for non-contacts (external)', async () => {
            const recipient = 'external.deleted@test.email';
            const lastMinutePreferences = mockEncryptionPreferences[recipient];
            const cachedPreferences: SendInfo = {
                sendPreferences: {
                    sign: true,
                    encrypt: false,
                    isPublicKeyPinned: false,
                    hasApiKeys: false,
                    hasPinnedKeys: false,
                    pgpScheme: PACKAGE_TYPE.SEND_PGP_MIME,
                    mimeType: MIME_TYPES.MIME,
                },
                contactSignatureInfo: {
                    isVerified: undefined,
                    creationTime: undefined,
                },
                loading: false,
                emailValidation: true,
            };
            const { extendedVerifications } = setup().result.current;
            const message = createMessage(recipient);
            const mapSendInfo = { [recipient]: cachedPreferences };
            const { mapSendPrefs } = await extendedVerifications(message, mapSendInfo);

            expect(mockCreateModalSpy).not.toHaveBeenCalled(); // user was not warned
            expect(mapSendPrefs[recipient]).toStrictEqual(getSendPreferences(lastMinutePreferences, message));
            // sanity checks
            expect(mapSendPrefs[recipient].encrypt).toBe(false);
            expect(mapSendPrefs[recipient].isPublicKeyPinned).toBe(false);
        });

        it('should silently send with last-minute prefs if no trusted send prefs are given', async () => {
            const recipient = 'internal.pinned@test.email';
            const lastMinutePreferences = mockEncryptionPreferences[recipient];

            const { extendedVerifications } = setup().result.current;
            const message = createMessage(recipient);
            const { mapSendPrefs } = await extendedVerifications(message, {});

            expect(mockCreateModalSpy).not.toHaveBeenCalled(); // user was not warned
            expect(mapSendPrefs[recipient]).toStrictEqual(getSendPreferences(lastMinutePreferences, message));
            // sanity checks
            expect(mapSendPrefs[recipient].encrypt).toBe(true);
            expect(mapSendPrefs[recipient].isPublicKeyPinned).toBe(true);
        });
    });
});
