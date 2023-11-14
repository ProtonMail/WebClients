import { fireEvent, waitFor } from '@testing-library/react';

import { CryptoProxy } from '@proton/crypto';
import { API_CODES, CONTACT_CARD_TYPE, KEY_FLAG } from '@proton/shared/lib/constants';
import { parseToVCard } from '@proton/shared/lib/contacts/vcard';
import { RequireSome } from '@proton/shared/lib/interfaces';
import { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

import { api, clearAll, mockedCryptoApi, notificationManager, render } from '../tests/render';
import ContactEmailSettingsModal, { ContactEmailSettingsProps } from './ContactEmailSettingsModal';

describe('ContactEmailSettingsModal', () => {
    const props: ContactEmailSettingsProps = {
        contactID: 'ContactID',
        vCardContact: { fn: [] },
        emailProperty: {} as VCardProperty<string>,
        onClose: jest.fn(),
    };

    beforeEach(clearAll);

    afterEach(async () => {
        await CryptoProxy.releaseEndpoint();
    });

    it('should save a contact with updated email settings (no keys)', async () => {
        CryptoProxy.setEndpoint(mockedCryptoApi);

        const vcard = `BEGIN:VCARD
VERSION:4.0
FN;PREF=1:J. Doe
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
ITEM1.EMAIL;PREF=1:jdoe@example.com
END:VCARD`;

        const vCardContact = parseToVCard(vcard) as RequireSome<VCardContact, 'email'>;

        const saveRequestSpy = jest.fn();

        api.mockImplementation(async (args: any): Promise<any> => {
            if (args.url === 'core/v4/keys/all') {
                return { Address: { Keys: [] } };
            }
            if (args.url === 'contacts/v4/contacts') {
                saveRequestSpy(args.data);
                return { Responses: [{ Response: { Code: API_CODES.SINGLE_SUCCESS } }] };
            }
            if (args.url === 'contacts/v4/contacts/ContactID') {
                saveRequestSpy(args.data);
                return { Code: API_CODES.SINGLE_SUCCESS };
            }
        });

        const { getByText, getByTitle } = render(
            <ContactEmailSettingsModal
                open={true}
                {...props}
                vCardContact={vCardContact}
                emailProperty={vCardContact.email?.[0]}
            />
        );

        const showMoreButton = getByText('Show advanced PGP settings');
        await waitFor(() => expect(showMoreButton).not.toBeDisabled());
        fireEvent.click(showMoreButton);

        const encryptToggle = document.getElementById('encrypt-toggle');
        expect(encryptToggle).toBeDisabled();

        const signSelect = getByText("Use global default (Don't sign)", { exact: false });
        fireEvent.click(signSelect);
        const signOption = getByTitle('Sign');
        fireEvent.click(signOption);

        const pgpSelect = getByText('Use global default (PGP/MIME)', { exact: false });
        fireEvent.click(pgpSelect);
        const pgpInlineOption = getByTitle('PGP/Inline');
        fireEvent.click(pgpInlineOption);

        const saveButton = getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => expect(notificationManager.createNotification).toHaveBeenCalled());

        const sentData = saveRequestSpy.mock.calls[0][0];
        const cards = sentData.Cards;

        const expectedEncryptedCard = `BEGIN:VCARD
VERSION:4.0
FN;PREF=1:J. Doe
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
ITEM1.EMAIL;PREF=1:jdoe@example.com
ITEM1.X-PM-MIMETYPE:text/plain
ITEM1.X-PM-SIGN:true
ITEM1.X-PM-SCHEME:pgp-inline
END:VCARD`.replaceAll('\n', '\r\n');

        const signedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.SIGNED
        ).Data;

        expect(signedCardContent).toBe(expectedEncryptedCard);
    });

    it('should not store X-PM-SIGN if global default signing setting is selected', async () => {
        CryptoProxy.setEndpoint(mockedCryptoApi);

        const vcard = `BEGIN:VCARD
VERSION:4.0
FN;PREF=1:J. Doe
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
ITEM1.EMAIL;PREF=1:jdoe@example.com
ITEM1.X-PM-SIGN:true
END:VCARD`;

        const vCardContact = parseToVCard(vcard) as RequireSome<VCardContact, 'email'>;

        const saveRequestSpy = jest.fn();

        api.mockImplementation(async (args: any): Promise<any> => {
            if (args.url === 'core/v4/keys/all') {
                return { Address: { Keys: [] } };
            }
            if (args.url === 'contacts/v4/contacts') {
                saveRequestSpy(args.data);
                return { Responses: [{ Response: { Code: API_CODES.SINGLE_SUCCESS } }] };
            }
            if (args.url === 'contacts/v4/contacts/ContactID') {
                saveRequestSpy(args.data);
                return { Code: API_CODES.SINGLE_SUCCESS };
            }
        });

        const { getByText, getByTitle } = render(
            <ContactEmailSettingsModal
                open={true}
                {...props}
                vCardContact={vCardContact}
                emailProperty={vCardContact.email?.[0]}
            />
        );

        const showMoreButton = getByText('Show advanced PGP settings');
        await waitFor(() => expect(showMoreButton).not.toBeDisabled());
        fireEvent.click(showMoreButton);

        const signSelect = getByText('Sign', { exact: true });
        fireEvent.click(signSelect);
        const signOption = getByTitle("Use global default (Don't sign)");
        fireEvent.click(signOption);

        const saveButton = getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => expect(notificationManager.createNotification).toHaveBeenCalled());

        const sentData = saveRequestSpy.mock.calls[0][0];
        const cards = sentData.Cards;

        const expectedCard = `BEGIN:VCARD
VERSION:4.0
FN;PREF=1:J. Doe
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
ITEM1.EMAIL;PREF=1:jdoe@example.com
END:VCARD`.replaceAll('\n', '\r\n');

        const signedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.SIGNED
        ).Data;

        expect(signedCardContent).toBe(expectedCard);
    });

    it('should warn if encryption is enabled and uploaded keys are not valid for sending', async () => {
        CryptoProxy.setEndpoint({
            ...mockedCryptoApi,
            importPublicKey: jest.fn().mockImplementation(async () => ({
                getFingerprint: () => `abcdef`,
                getCreationTime: () => new Date(0),
                getExpirationTime: () => new Date(0),
                getAlgorithmInfo: () => ({ algorithm: 'eddsa', curve: 'curve25519' }),
                subkeys: [],
                getUserIDs: jest.fn().mockImplementation(() => ['<userid@userid.com>']),
            })),
            canKeyEncrypt: jest.fn().mockImplementation(() => false),
            exportPublicKey: jest.fn().mockImplementation(() => new Uint8Array()),
            isExpiredKey: jest.fn().mockImplementation(() => true),
            isRevokedKey: jest.fn().mockImplementation(() => false),
        });

        const vcard = `BEGIN:VCARD
VERSION:4.0
FN;PREF=1:expired
UID:proton-web-b2dc0409-262d-96db-8925-3ee4f0030fd8
ITEM1.EMAIL;PREF=1:expired@test.com
ITEM1.KEY;PREF=1:data:application/pgp-keys;base64,xjMEYS376BYJKwYBBAHaRw8BA
 QdAm9ZJKSCnCg28vJ/1Iegycsiq9wKxFP5/BMDeP51C/jbNGmV4cGlyZWQgPGV4cGlyZWRAdGVz
 dC5jb20+wpIEEBYKACMFAmEt++gFCQAAAPoECwkHCAMVCAoEFgACAQIZAQIbAwIeAQAhCRDs7cn
 9e8csRhYhBP/xHanO8KRS6sPFiOztyf17xyxGhYIBANpMcbjGa3w3qPzWDfb3b/TgfbJuYFQ49Y
 ik/Zd/ZZQZAP42rtyxbSz/XfKkNdcJPbZ+MQa2nalOZ6+uXm9ScCQtBc44BGEt++gSCisGAQQBl
 1UBBQEBB0Dj+ZNzODXqLeZchFOVE4E87HD8QsoSI60bDkpklgK3eQMBCAfCfgQYFggADwUCYS37
 6AUJAAAA+gIbDAAhCRDs7cn9e8csRhYhBP/xHanO8KRS6sPFiOztyf17xyxGbyIA/2Jz6p/6WBo
 yh279kjiKpX8NWde/2/O7M7W7deYulO4oAQDWtYZNTw1OTYfYI2PBcs1kMbB3hhBr1VEG0pLvtz
 xoAA==
ITEM1.X-PM-ENCRYPT:true
ITEM1.X-PM-SIGN:true
END:VCARD`;

        const vCardContact = parseToVCard(vcard) as RequireSome<VCardContact, 'email'>;

        const saveRequestSpy = jest.fn();

        api.mockImplementation(async (args: any): Promise<any> => {
            if (args.url === 'core/v4/keys/all') {
                return { Address: { Keys: [] } };
            }
            if (args.url === 'contacts/v4/contacts') {
                saveRequestSpy(args.data);
                return { Responses: [{ Response: { Code: API_CODES.SINGLE_SUCCESS } }] };
            }
            if (args.url === 'contacts/v4/contacts/ContactID') {
                saveRequestSpy(args.data);
                return { Code: API_CODES.SINGLE_SUCCESS };
            }
        });

        const { getByText } = render(
            <ContactEmailSettingsModal
                open={true}
                {...props}
                vCardContact={vCardContact}
                emailProperty={vCardContact.email?.[0]}
            />
        );

        const showMoreButton = getByText('Show advanced PGP settings');
        await waitFor(() => expect(showMoreButton).not.toBeDisabled());
        fireEvent.click(showMoreButton);

        await waitFor(() => {
            const keyFingerprint = getByText('abcdef');
            return expect(keyFingerprint).toBeVisible();
        });

        const warningInvalidKey = getByText(/None of the uploaded keys are valid for encryption/);
        expect(warningInvalidKey).toBeVisible();

        const encryptToggleLabel = getByText('Encrypt emails');
        fireEvent.click(encryptToggleLabel);

        expect(warningInvalidKey).not.toBeVisible();

        const saveButton = getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => expect(notificationManager.createNotification).toHaveBeenCalled());

        const sentData = saveRequestSpy.mock.calls[0][0];
        const cards = sentData.Cards;

        const signedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.SIGNED
        ).Data;

        expect(signedCardContent.includes('ITEM1.X-PM-ENCRYPT:false')).toBe(true);
    });

    it('should enable encryption by default if WKD keys are found', async () => {
        CryptoProxy.setEndpoint({
            ...mockedCryptoApi,
            importPublicKey: jest.fn().mockImplementation(async () => ({
                getFingerprint: () => `abcdef`,
                getCreationTime: () => new Date(0),
                getExpirationTime: () => new Date(0),
                getAlgorithmInfo: () => ({ algorithm: 'eddsa', curve: 'curve25519' }),
                subkeys: [],
                getUserIDs: jest.fn().mockImplementation(() => ['<jdoe@example.com>']),
            })),
            canKeyEncrypt: jest.fn().mockImplementation(() => true),
            exportPublicKey: jest.fn().mockImplementation(() => new Uint8Array()),
            isExpiredKey: jest.fn().mockImplementation(() => false),
            isRevokedKey: jest.fn().mockImplementation(() => false),
        });
        const armoredPublicKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEYRaiLRYJKwYBBAHaRw8BAQdAMrsrfniSJuxOLn+Q3VKP0WWqgizG4VOF
6t0HZYx8mSnNEHRlc3QgPHRlc3RAYS5pdD7CjAQQFgoAHQUCYRaiLQQLCQcI
AxUICgQWAAIBAhkBAhsDAh4BACEJEKaNwv/NOLSZFiEEnJT1OMsrVBCZa+wE
po3C/804tJnYOAD/YR2og60sJ2VVhPwYRL258dYIHnJXI2dDXB+m76GK9x4A
/imlPnTOgIJAV1xOqkvO96QcbawjKgvH829zxN9DZEgMzjgEYRaiLRIKKwYB
BAGXVQEFAQEHQN5UswYds0RWr4I7xNKNK+fOn+o9pYkkYzJwCbqxCsBwAwEI
B8J4BBgWCAAJBQJhFqItAhsMACEJEKaNwv/NOLSZFiEEnJT1OMsrVBCZa+wE
po3C/804tJkeKgEA0ruKx9rcMTi4LxfYgijjPrI+GgrfegfREt/YN2KQ75gA
/Rs9S+8arbQVoniq7izz3uisWxfjMup+IVEC5uqMld8L
=8+ep
-----END PGP PUBLIC KEY BLOCK-----`;

        const vcard = `BEGIN:VCARD
VERSION:4.0
FN;PREF=1:J. Doe
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
ITEM1.EMAIL;PREF=1:jdoe@example.com
ITEM1.X-PM-ENCRYPT:true
END:VCARD`;

        const vCardContact = parseToVCard(vcard) as RequireSome<VCardContact, 'email'>;

        const saveRequestSpy = jest.fn();

        api.mockImplementation(async (args: any): Promise<any> => {
            if (args.url === 'core/v4/keys/all') {
                return {
                    Address: { Keys: [] },
                    Unverified: {
                        Keys: [{ Flags: 3, PublicKey: armoredPublicKey }],
                    },
                };
            }
            if (args.url === 'contacts/v4/contacts') {
                saveRequestSpy(args.data);
                return { Responses: [{ Response: { Code: API_CODES.SINGLE_SUCCESS } }] };
            }
            if (args.url === 'contacts/v4/contacts/ContactID') {
                saveRequestSpy(args.data);
                return { Code: API_CODES.SINGLE_SUCCESS };
            }
        });

        const { getByText } = render(
            <ContactEmailSettingsModal
                open={true}
                {...props}
                vCardContact={vCardContact}
                emailProperty={vCardContact.email?.[0]}
            />
        );

        const showMoreButton = getByText('Show advanced PGP settings');
        await waitFor(() => expect(showMoreButton).not.toBeDisabled());
        fireEvent.click(showMoreButton);

        const encryptToggle = document.getElementById('encrypt-toggle');
        expect(encryptToggle).not.toBeDisabled();
        expect(encryptToggle).toBeChecked();

        const signSelectDropdown = document.getElementById('sign-select');
        expect(signSelectDropdown).toBeDisabled();
        signSelectDropdown?.innerHTML.includes('Sign');

        const saveButton = getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => expect(notificationManager.createNotification).toHaveBeenCalled());

        const sentData = saveRequestSpy.mock.calls[0][0];
        const cards = sentData.Cards;

        const expectedEncryptedCard = `BEGIN:VCARD
VERSION:4.0
FN;PREF=1:J. Doe
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
ITEM1.EMAIL;PREF=1:jdoe@example.com
ITEM1.X-PM-ENCRYPT-UNTRUSTED:true
ITEM1.X-PM-SIGN:true
END:VCARD`.replaceAll('\n', '\r\n');

        const signedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.SIGNED
        ).Data;

        expect(signedCardContent).toBe(expectedEncryptedCard);
    });

    it('should warn if encryption is enabled and WKD keys are not valid for sending', async () => {
        CryptoProxy.setEndpoint({
            ...mockedCryptoApi,
            importPublicKey: jest.fn().mockImplementation(async () => ({
                getFingerprint: () => `abcdef`,
                getCreationTime: () => new Date(0),
                getExpirationTime: () => new Date(0),
                getAlgorithmInfo: () => ({ algorithm: 'eddsa', curve: 'curve25519' }),
                subkeys: [],
                getUserIDs: jest.fn().mockImplementation(() => ['<userid@userid.com>']),
            })),
            canKeyEncrypt: jest.fn().mockImplementation(() => false),
            exportPublicKey: jest.fn().mockImplementation(() => new Uint8Array()),
            isExpiredKey: jest.fn().mockImplementation(() => true),
            isRevokedKey: jest.fn().mockImplementation(() => false),
        });

        const armoredPublicKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEYS376BYJKwYBBAHaRw8BAQdAm9ZJKSCnCg28vJ/1Iegycsiq9wKxFP5/
BMDeP51C/jbNGmV4cGlyZWQgPGV4cGlyZWRAdGVzdC5jb20+wpIEEBYKACMF
AmEt++gFCQAAAPoECwkHCAMVCAoEFgACAQIZAQIbAwIeAQAhCRDs7cn9e8cs
RhYhBP/xHanO8KRS6sPFiOztyf17xyxGhYIBANpMcbjGa3w3qPzWDfb3b/Tg
fbJuYFQ49Yik/Zd/ZZQZAP42rtyxbSz/XfKkNdcJPbZ+MQa2nalOZ6+uXm9S
cCQtBc44BGEt++gSCisGAQQBl1UBBQEBB0Dj+ZNzODXqLeZchFOVE4E87HD8
QsoSI60bDkpklgK3eQMBCAfCfgQYFggADwUCYS376AUJAAAA+gIbDAAhCRDs
7cn9e8csRhYhBP/xHanO8KRS6sPFiOztyf17xyxGbyIA/2Jz6p/6WBoyh279
kjiKpX8NWde/2/O7M7W7deYulO4oAQDWtYZNTw1OTYfYI2PBcs1kMbB3hhBr
1VEG0pLvtzxoAA==
=456g
-----END PGP PUBLIC KEY BLOCK-----`;

        const vcard = `BEGIN:VCARD
VERSION:4.0
FN;PREF=1:J. Doe
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
ITEM1.EMAIL;PREF=1:jdoe@example.com
END:VCARD`;

        const vCardContact = parseToVCard(vcard) as RequireSome<VCardContact, 'email'>;

        const saveRequestSpy = jest.fn();

        api.mockImplementation(async (args: any): Promise<any> => {
            if (args.url === 'core/v4/keys/all') {
                return {
                    Address: { Keys: [] },
                    Unverified: { Keys: [{ Flags: 3, PublicKey: armoredPublicKey }] },
                };
            }
            if (args.url === 'contacts/v4/contacts') {
                saveRequestSpy(args.data);
                return { Responses: [{ Response: { Code: API_CODES.SINGLE_SUCCESS } }] };
            }
            if (args.url === 'contacts/v4/contacts/ContactID') {
                saveRequestSpy(args.data);
                return { Code: API_CODES.SINGLE_SUCCESS };
            }
        });

        const { getByText } = render(
            <ContactEmailSettingsModal
                open={true}
                {...props}
                vCardContact={vCardContact}
                emailProperty={vCardContact.email?.[0]}
            />
        );

        const showMoreButton = getByText('Show advanced PGP settings');
        await waitFor(() => expect(showMoreButton).not.toBeDisabled());
        fireEvent.click(showMoreButton);

        await waitFor(() => {
            const keyFingerprint = getByText('abcdef');
            return expect(keyFingerprint).toBeVisible();
        });

        const warningInvalidKey = getByText(/None of the uploaded keys are valid for encryption/);
        expect(warningInvalidKey).toBeVisible();

        const encryptToggleLabel = getByText('Encrypt emails');
        fireEvent.click(encryptToggleLabel);

        expect(warningInvalidKey).not.toBeVisible();

        const saveButton = getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => expect(notificationManager.createNotification).toHaveBeenCalled());

        const sentData = saveRequestSpy.mock.calls[0][0];
        const cards = sentData.Cards;

        const signedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.SIGNED
        ).Data;

        expect(signedCardContent.includes('ITEM1.X-PM-ENCRYPT-UNTRUSTED:false')).toBe(true);
    });

    it('should indicate that end-to-end encryption is disabled for internal addresses whose keys have e2ee-disabled flags', async () => {
        CryptoProxy.setEndpoint({
            ...mockedCryptoApi,
            importPublicKey: jest.fn().mockImplementation(async () => ({
                getFingerprint: () => `abcdef`,
                getCreationTime: () => new Date(0),
                getExpirationTime: () => new Date(0),
                getAlgorithmInfo: () => ({ algorithm: 'eddsa', curve: 'curve25519' }),
                subkeys: [],
                getUserIDs: jest.fn().mockImplementation(() => ['<userid@userid.com>']),
            })),
            canKeyEncrypt: jest.fn().mockImplementation(() => true),
            exportPublicKey: jest.fn().mockImplementation(() => new Uint8Array()),
            isExpiredKey: jest.fn().mockImplementation(() => false),
            isRevokedKey: jest.fn().mockImplementation(() => false),
        });

        const vcard = `BEGIN:VCARD
VERSION:4.0
FN;PREF=1:J. Doe
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
ITEM1.EMAIL;PREF=1:jdoe@proton.me
END:VCARD`;

        const vCardContact = parseToVCard(vcard) as RequireSome<VCardContact, 'email'>;

        const saveRequestSpy = jest.fn();

        api.mockImplementation(async (args: any): Promise<any> => {
            if (args.url === 'core/v4/keys/all') {
                return {
                    Address: {
                        Keys: [
                            {
                                PublicKey: 'mocked armored key',
                                Flags: KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT | KEY_FLAG.FLAG_NOT_COMPROMISED,
                            },
                        ],
                    },
                    ProtonMX: true, // internal address
                };
            }
            if (args.url === 'contacts/v4/contacts') {
                saveRequestSpy(args.data);
                return { Responses: [{ Response: { Code: API_CODES.SINGLE_SUCCESS } }] };
            }
            if (args.url === 'contacts/v4/contacts/ContactID') {
                saveRequestSpy(args.data);
                return { Code: API_CODES.SINGLE_SUCCESS };
            }
        });

        const { getByText, getByTitle, queryByText } = render(
            <ContactEmailSettingsModal
                open={true}
                {...props}
                vCardContact={vCardContact}
                emailProperty={vCardContact.email?.[0]}
            />
        );

        const showMoreButton = getByText('Show advanced PGP settings');
        await waitFor(() => expect(showMoreButton).not.toBeDisabled());
        fireEvent.click(showMoreButton);

        await waitFor(() => {
            const keyFingerprint = getByText('abcdef');
            return expect(keyFingerprint).toBeVisible();
        });

        const infoEncryptionDisabled = getByText(/The owner of this address has disabled end-to-end encryption/);
        expect(infoEncryptionDisabled).toBeVisible();

        expect(queryByText('Encrypt emails')).toBeNull();
        expect(queryByText('Sign emails')).toBeNull();
        expect(queryByText('Upload keys')).toBeNull();

        const dropdownButton = getByTitle('Open actions dropdown');
        fireEvent.click(dropdownButton);
        const trustKeyButton = getByText('Trust');
        fireEvent.click(trustKeyButton);

        const saveButton = getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => expect(notificationManager.createNotification).toHaveBeenCalled());

        const sentData = saveRequestSpy.mock.calls[0][0];
        const cards = sentData.Cards;

        const signedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.SIGNED
        ).Data;
        expect(signedCardContent.includes('ITEM1.KEY;PREF=1:data:application/pgp-keys')).toBe(true);
        expect(signedCardContent.includes('ITEM1.X-PM-ENCRYPT')).toBe(false);
        expect(signedCardContent.includes('ITEM1.X-PM-SIGN')).toBe(false);
    });

    it('shoul display WKD keys but not internal address keys for external account with internal address keys', async () => {
        CryptoProxy.setEndpoint({
            ...mockedCryptoApi,
            importPublicKey: jest.fn().mockImplementation(async ({ armoredKey }) => ({
                getFingerprint: () => armoredKey,
                getCreationTime: () => new Date(0),
                getExpirationTime: () => new Date(0),
                getAlgorithmInfo: () => ({ algorithm: 'eddsa', curve: 'curve25519' }),
                subkeys: [],
                getUserIDs: jest.fn().mockImplementation(() => ['<userid@userid.com>']),
            })),
            canKeyEncrypt: jest.fn().mockImplementation(() => true),
            exportPublicKey: jest.fn().mockImplementation(() => new Uint8Array()),
            isExpiredKey: jest.fn().mockImplementation(() => false),
            isRevokedKey: jest.fn().mockImplementation(() => false),
        });

        const vcard = `BEGIN:VCARD
VERSION:4.0
FN;PREF=1:J. Doe
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
ITEM1.EMAIL;PREF=1:jdoe@example.com
END:VCARD`;

        const vCardContact = parseToVCard(vcard) as RequireSome<VCardContact, 'email'>;

        const saveRequestSpy = jest.fn();

        api.mockImplementation(async (args: any): Promise<any> => {
            if (args.url === 'core/v4/keys/all') {
                return {
                    Address: {
                        Keys: [
                            {
                                PublicKey: 'internal mocked armored key',
                                Flags: KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT | KEY_FLAG.FLAG_NOT_COMPROMISED,
                            },
                        ],
                    },
                    Unverified: {
                        Keys: [{ PublicKey: 'wkd mocked armored key', Flags: KEY_FLAG.FLAG_NOT_COMPROMISED }],
                    },
                    ProtonMX: false, // external account
                };
            }
            if (args.url === 'contacts/v4/contacts') {
                saveRequestSpy(args.data);
                return { Responses: [{ Response: { Code: API_CODES.SINGLE_SUCCESS } }] };
            }
            if (args.url === 'contacts/v4/contacts/ContactID') {
                saveRequestSpy(args.data);
                return { Code: API_CODES.SINGLE_SUCCESS };
            }
        });

        const { getByText, getByTitle, queryByText } = render(
            <ContactEmailSettingsModal
                open={true}
                {...props}
                vCardContact={vCardContact}
                emailProperty={vCardContact.email?.[0]}
            />
        );

        const showMoreButton = getByText('Show advanced PGP settings');
        await waitFor(() => expect(showMoreButton).not.toBeDisabled());
        fireEvent.click(showMoreButton);

        await waitFor(() => {
            const internalAddressKeyFingerprint = queryByText('internal mocked armored key');
            return expect(internalAddressKeyFingerprint).toBeNull();
        });

        await waitFor(() => {
            const wkdKeyFingerprint = getByText('wkd mocked armored key');
            return expect(wkdKeyFingerprint).toBeVisible();
        });

        const infoEncryptionDisabled = queryByText(/The owner of this address has disabled end-to-end encryption/);
        expect(infoEncryptionDisabled).toBeNull(); // only shown to internal accounts

        // Ensure the UI matches that of external recipients with WKD keys:
        // - encryption should be enabled by default, and toggable
        // - key uploads are not permitted
        // - key pinning works stores the X-PM-ENCRYPT flag
        const encryptToggle = document.getElementById('encrypt-toggle');
        expect(encryptToggle).not.toBeDisabled();
        expect(encryptToggle).toBeChecked();

        const signSelectDropdown = document.getElementById('sign-select');
        expect(signSelectDropdown).toBeDisabled();
        signSelectDropdown?.innerHTML.includes('Sign');

        expect(queryByText('Upload keys')).toBeNull();

        const dropdownButton = getByTitle('Open actions dropdown');
        fireEvent.click(dropdownButton);
        const trustKeyButton = getByText('Trust');
        fireEvent.click(trustKeyButton);

        const saveButton = getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => expect(notificationManager.createNotification).toHaveBeenCalled());

        const sentData = saveRequestSpy.mock.calls[0][0];
        const cards = sentData.Cards;

        const signedCardContent = cards.find(
            ({ Type }: { Type: CONTACT_CARD_TYPE }) => Type === CONTACT_CARD_TYPE.SIGNED
        ).Data;

        expect(signedCardContent.includes('ITEM1.KEY;PREF=1:data:application/pgp-keys')).toBe(true);
        expect(signedCardContent.includes('ITEM1.X-PM-ENCRYPT:true')).toBe(true);
        expect(signedCardContent.includes('ITEM1.X-PM-SIGN:true')).toBe(true);
    });
});
