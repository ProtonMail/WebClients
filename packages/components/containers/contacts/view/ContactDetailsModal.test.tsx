import { CryptoProxy } from '@proton/crypto';
import { SHOW_IMAGES } from '@proton/shared/lib/mail/mailSettings';

import { addToCache, api, clearAll, minimalCache, mockedCryptoApi, prepareContact, render } from '../tests/render';
import ContactDetailsModal, { ContactDetailsProps } from './ContactDetailsModal';

jest.mock('../../../hooks/useConfig', () => () => ({ API_URL: 'api' }));

describe('ContactDetailsModal', () => {
    const props: ContactDetailsProps = {
        contactID: 'ContactID',
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        onMailTo: jest.fn(),
        onEmailSettings: jest.fn(),
        onGroupDetails: jest.fn(),
        onGroupEdit: jest.fn(),
        onUpgrade: jest.fn(),
        onDecryptionError: jest.fn(),
        onSignatureError: jest.fn(),
    };

    beforeAll(() => {
        CryptoProxy.setEndpoint(mockedCryptoApi);
    });

    beforeEach(clearAll);

    afterAll(async () => {
        await CryptoProxy.releaseEndpoint();
    });

    it('should show basic contact informations', async () => {
        const vcard = `BEGIN:VCARD
VERSION:4.0
UID:urn:uuid:4fbe8971-0bc3-424c-9c26-36c3e1eff6b1
FN:J. Doe
FN:FN2
EMAIL:jdoe@example.com
NOTE:TestNote
ADR:1;2;3;4;5;6;7
ADR:;;;;;;testadr
TEL:testtel
PHOTO:https://example.com/myphoto.jpg
END:VCARD`;

        const { Cards } = await prepareContact(vcard);

        api.mockImplementation(async (args: any): Promise<any> => {
            if (args.url === 'contacts/v4/contacts/ContactID') {
                return { Contact: { ID: 'ID', ContactID: 'ContactID', Cards } };
            }
        });
        minimalCache();
        addToCache('MailSettings', { HideRemoteImages: SHOW_IMAGES.HIDE });

        const { findByText } = render(<ContactDetailsModal open={true} {...props} />, false);

        await findByText('J. Doe');
        await findByText('Load image');
        await findByText('FN2');
        await findByText('jdoe@example.com');
        await findByText('testtel');
        await findByText(/3.*2.*6, 4.*1.*5, 7/);
        await findByText('testadr');
        await findByText('TestNote');
    });
});
