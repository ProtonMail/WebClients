import loudRejection from 'loud-rejection';

import { MIME_TYPES, MIME_TYPES_MORE, PGP_SCHEMES } from '@proton/shared/lib/constants';
import type { EncryptionPreferences } from '@proton/shared/lib/mail/encryptionPreferences';
import { PACKAGE_TYPE } from '@proton/shared/lib/mail/mailSettings';
import getSendPreferences from '@proton/shared/lib/mail/send/getSendPreferences';

import { clearAll, renderHook } from '../../helpers/test/helper';
import type { SendInfo } from '../../models/crypto';
import { useSendVerifications } from './useSendVerifications';

loudRejection();

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
        verifyingPinnedKeys: [],
        isInternal: true,
        hasApiKeys: true,
        hasPinnedKeys: true,
        isContact: true,
        isInternalWithDisabledE2EEForMail: false,
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
        verifyingPinnedKeys: [],
        isInternal: true,
        hasApiKeys: true,
        hasPinnedKeys: false,
        isContact: true,
        isInternalWithDisabledE2EEForMail: false,
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
        verifyingPinnedKeys: [],
        isInternal: true,
        hasApiKeys: true,
        hasPinnedKeys: false,
        isContact: true,
        isInternalWithDisabledE2EEForMail: false,
    },

    'internal.pinned.e2eedisabled@test.email': {
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
        verifyingPinnedKeys: [],
        isInternal: true,
        hasApiKeys: true,
        hasPinnedKeys: true,
        isContact: true,
        isInternalWithDisabledE2EEForMail: true,
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
        verifyingPinnedKeys: [],
        isInternal: false,
        hasApiKeys: false,
        hasPinnedKeys: true,
        isContact: true,
        isInternalWithDisabledE2EEForMail: false,
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
        verifyingPinnedKeys: [],
        isInternal: false,
        hasApiKeys: false,
        hasPinnedKeys: false,
        isContact: true,
        isInternalWithDisabledE2EEForMail: false,
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
        verifyingPinnedKeys: [],
        isInternal: false,
        hasApiKeys: false,
        hasPinnedKeys: true,
        isContact: true,
        isInternalWithDisabledE2EEForMail: false,
    },
};

const mockCreateModalSpy = jest.fn(({ ...props }) => {
    props.props.onSubmit();
});

jest.mock('@proton/components/hooks/useGetEncryptionPreferences', () => ({
    __esModule: true,
    default: () => {
        const getEncryptionPreferences: ({ email }: { email: string }) => EncryptionPreferences = ({ email }) =>
            mockEncryptionPreferences[email];
        return getEncryptionPreferences;
    },
}));
jest.mock('@proton/components/hooks/useModals', () => ({
    __esModule: true,
    default: () => {
        return {
            createModal: mockCreateModalSpy,
        };
    },
}));

const originalResizeObserver = window.ResizeObserver;
const ResizeObserverMock = jest.fn(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
}));

beforeAll(() => {
    window.ResizeObserver = ResizeObserverMock;
});

afterAll(() => {
    window.ResizeObserver = originalResizeObserver;
});

describe('useSendVerifications', () => {
    const setup = async () => {
        const result = await renderHook({ useCallback: () => useSendVerifications() });
        return result.result.current.extendedVerifications as any;
    };

    afterEach(clearAll);

    describe('extended verifications of last-minute preferences', () => {
        // eslint-disable-next-line no-only-tests/no-only-tests
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
                    encryptionDisabled: false,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(),
                },
                loading: false,
                emailValidation: true,
            };
            const extendedVerifications = await setup();
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
                    encryptionDisabled: false,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(),
                },
                loading: false,
                emailValidation: true,
            };
            const extendedVerifications = await setup();
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

        it('should warn user on encryption disabled with contact with pinned keys (internal case only)', async () => {
            const recipient = 'internal.pinned.e2eedisabled@test.email';
            const lastMinutePreferences = mockEncryptionPreferences[recipient];
            const cachedPreferences: SendInfo = {
                sendPreferences: {
                    encrypt: true,
                    sign: true,
                    isPublicKeyPinned: true,
                    hasApiKeys: true,
                    hasPinnedKeys: true,
                    pgpScheme: PACKAGE_TYPE.SEND_PM,
                    mimeType: MIME_TYPES.DEFAULT,
                    encryptionDisabled: false,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(+lastMinutePreferences.contactSignatureTimestamp!),
                },
                loading: false,
                emailValidation: true,
            };
            const extendedVerifications = await setup();
            const message = createMessage(recipient);
            const mapSendInfo = { [recipient]: cachedPreferences };
            const { mapSendPrefs } = await extendedVerifications(message, mapSendInfo);

            expect(mockCreateModalSpy).toHaveBeenCalled(); // user was warned
            expect(mapSendPrefs[recipient]).toStrictEqual(getSendPreferences(lastMinutePreferences, message));
            // sanity checks
            expect(mapSendPrefs[recipient].encrypt).toBe(false);
            expect(mapSendPrefs[recipient].isPublicKeyPinned).toBe(true);
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
                    encryptionDisabled: false,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(),
                },
                loading: false,
                emailValidation: true,
            };
            const extendedVerifications = await setup();
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
                    encryptionDisabled: false,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(+lastMinutePreferences.contactSignatureTimestamp! - 1),
                },
                loading: false,
                emailValidation: true,
            };
            const extendedVerifications = await setup();
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
                    encryptionDisabled: false,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(+lastMinutePreferences.contactSignatureTimestamp! - 1),
                },
                loading: false,
                emailValidation: true,
            };
            const extendedVerifications = await setup();
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
                    encryptionDisabled: false,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(+lastMinutePreferences.contactSignatureTimestamp! + 1),
                },
                loading: false,
                emailValidation: true,
            };
            const extendedVerifications = await setup();
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
                    encryptionDisabled: false,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(+lastMinutePreferences.contactSignatureTimestamp! + 1),
                },
                loading: false,
                emailValidation: true,
            };
            const extendedVerifications = await setup();
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
                    encryptionDisabled: false,
                },
                contactSignatureInfo: {
                    isVerified: undefined,
                    creationTime: undefined,
                },
                loading: false,
                emailValidation: true,
            };
            const extendedVerifications = await setup();
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
                    encryptionDisabled: false,
                },
                contactSignatureInfo: {
                    isVerified: true,
                    creationTime: new Date(+lastMinutePreferences.contactSignatureTimestamp! - 1),
                },
                loading: false,
                emailValidation: true,
            };
            const extendedVerifications = await setup();
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
                    encryptionDisabled: false,
                },
                contactSignatureInfo: {
                    isVerified: undefined,
                    creationTime: undefined,
                },
                loading: false,
                emailValidation: true,
            };
            const extendedVerifications = await setup();
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
                    encryptionDisabled: false,
                },
                contactSignatureInfo: {
                    isVerified: undefined,
                    creationTime: undefined,
                },
                loading: false,
                emailValidation: true,
            };
            const extendedVerifications = await setup();
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

            const extendedVerifications = await setup();
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
