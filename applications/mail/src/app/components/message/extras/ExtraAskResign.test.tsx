import { PublicKeyReference } from '@proton/crypto';
import { fireEvent } from '@testing-library/dom';
import { addApiMock, clearAll, generateKeys, render, tick } from '../../../helpers/test/helper';
import { MessageVerification } from '../../../logic/messages/messagesTypes';
import ExtraAskResign from './ExtraAskResign';
import { store } from '../../../logic/store';
import { refresh } from '../../../logic/contacts/contactsActions';
import { contactEmails, message, setupContactsForPinKeys } from '../../../helpers/test/pinKeys';
import { setupCryptoProxyForTesting, releaseCryptoProxy } from '../../../helpers/test/crypto';

const getMessageVerification = (isSenderVerified: boolean, pinnedKeys?: PublicKeyReference[]) => {
    return {
        senderVerified: isSenderVerified,
        senderPinnedKeys: pinnedKeys,
    } as MessageVerification;
};

const setup = async (messageVerification: MessageVerification) => {
    const onResignContact = jest.fn();

    const component = await render(
        <ExtraAskResign message={message} messageVerification={messageVerification} onResignContact={onResignContact} />
    );

    return component;
};

describe('Extra ask resign banner', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    beforeEach(clearAll);

    it('should not display the extra ask resign banner when sender is verified and keys are pinned', async () => {
        const senderKey = await generateKeys('sender', message.Sender.Address);

        const messageVerification = getMessageVerification(true, [senderKey.publicKeys[0]]);
        const { queryByTestId } = await setup(messageVerification);

        const banner = queryByTestId('extra-ask-resign:banner');

        expect(banner).toBeNull();
    });

    it('should not display the extra ask resign banner when sender is verified and no keys are pinned', async () => {
        const messageVerification = getMessageVerification(true);
        const { queryByTestId } = await setup(messageVerification);

        const banner = queryByTestId('extra-ask-resign:banner');

        expect(banner).toBeNull();
    });

    it('should not display the extra ask resign banner when sender is not verified and no keys are pinned', async () => {
        const messageVerification = getMessageVerification(false);
        const { queryByTestId } = await setup(messageVerification);

        const banner = queryByTestId('extra-ask-resign:banner');

        expect(banner).toBeNull();
    });

    it('should display the extra ask resign banner when sender is not verified and keys are pinned', async () => {
        const { senderKeys } = await setupContactsForPinKeys();
        addApiMock('keys', () => ({ Keys: [senderKeys] }));

        // Initialize contactsMap
        store.dispatch(refresh({ contacts: [...contactEmails], contactGroups: [] }));

        const messageVerification = getMessageVerification(false, [senderKeys.publicKeys[0]]);
        const { getByTestId, getByText } = await setup(messageVerification);

        // Banner is displayed
        getByTestId('extra-ask-resign:banner');

        // Modal is opened
        const trustKeyButton = getByText('Verify');
        fireEvent.click(trustKeyButton);
        await tick();

        getByText('Trust pinned keys?');
    });
});
