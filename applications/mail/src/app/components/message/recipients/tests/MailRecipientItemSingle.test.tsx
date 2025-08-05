import { fireEvent, screen } from '@testing-library/react';

import type { Recipient } from '@proton/shared/lib/interfaces';

import type { GeneratedKey } from '../../../../helpers/test/crypto';
import { generateKeys, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../helpers/test/crypto';
import { clearAll } from '../../../../helpers/test/helper';
import { mailTestRender, tick } from '../../../../helpers/test/render';
import MailRecipientItemSingle from '../MailRecipientItemSingle';

const senderAddress = 'sender@outside.com';

const sender = {
    Name: 'sender',
    Address: senderAddress,
} as Recipient;

const modalsHandlers = {
    onContactDetails: jest.fn(),
    onContactEdit: jest.fn(),
};

describe('MailRecipientItemSingle trust public key item in dropdown', () => {
    let senderKeys: GeneratedKey;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        senderKeys = await generateKeys('sender', senderAddress);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(clearAll);

    const openDropdown = async () => {
        // Open the dropdown
        const recipientItem = screen.getByTestId(`recipient:details-dropdown-${sender.Address}`);
        fireEvent.click(recipientItem);
        await tick();

        // The dropdown must be open
        screen.getByText('New message');
    };

    it('should not contain the trust key action in the dropdown', async () => {
        await mailTestRender(<MailRecipientItemSingle recipient={sender} {...modalsHandlers} />);

        await openDropdown();

        // Trust public key dropdown item should not be found
        const dropdownItem = screen.queryByText('Trust public key');
        expect(dropdownItem).toBeNull();
    });

    it('should contain the trust key action in the dropdown if signing key', async () => {
        await mailTestRender(
            <MailRecipientItemSingle
                recipient={sender}
                signingPublicKey={senderKeys.publicKeys[0]}
                {...modalsHandlers}
            />
        );

        await openDropdown();

        // Trust public key dropdown item should be found
        screen.getByText('Trust public key');
    });

    it('should contain the trust key action in the dropdown if attached key', async () => {
        await mailTestRender(
            <MailRecipientItemSingle
                recipient={sender}
                attachedPublicKey={senderKeys.publicKeys[0]}
                {...modalsHandlers}
            />
        );

        await openDropdown();

        // Trust public key dropdown item should be found
        screen.getByText('Trust public key');
    });
});
