import { getModelState } from '@proton/account/test';
import { CryptoProxy } from '@proton/crypto';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { SHOW_IMAGES } from '@proton/shared/lib/mail/mailSettings';
import { addApiMock } from '@proton/testing/lib/api';

import { clearAll, minimalCache, mockedCryptoApi, prepareContact, renderWithProviders } from '../tests/render';
import type { ContactDetailsProps } from './ContactDetailsModal';
import ContactDetailsModal from './ContactDetailsModal';

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

        addApiMock('contacts/v4/contacts/ContactID', () => {
            return { Contact: { ID: 'ID', ContactID: 'ContactID', Cards } };
        });
        minimalCache();

        const { findByText } = renderWithProviders(<ContactDetailsModal open={true} {...props} />, {
            preloadedState: {
                mailSettings: getModelState({ HideRemoteImages: SHOW_IMAGES.HIDE } as MailSettings),
            },
        });

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
