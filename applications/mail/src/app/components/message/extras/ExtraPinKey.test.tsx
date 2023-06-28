import { Matcher, fireEvent } from '@testing-library/react';

import { PublicKeyReference } from '@proton/crypto';
import { Address, MailSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import {
    addApiMock,
    addToCache,
    clearAll,
    generateKeys,
    minimalCache,
    render,
    tick,
} from '../../../helpers/test/helper';
import { message } from '../../../helpers/test/pinKeys';
import { MessageVerification } from '../../../logic/messages/messagesTypes';
import ExtraPinKey from './ExtraPinKey';

const { SIGNED_AND_VALID, SIGNED_AND_INVALID, NOT_SIGNED, NOT_VERIFIED } = VERIFICATION_STATUS;

const setup = async (
    message: Message,
    messageVerification: MessageVerification,
    isOwnAddress = false,
    isAutoPrompt = false
) => {
    minimalCache();

    if (isOwnAddress) {
        addToCache('Addresses', [{ Email: 'sender@protonmail.com' } as Address]);
    }

    if (isAutoPrompt) {
        addToCache('MailSettings', { PromptPin: 1 } as MailSettings);
    }

    const component = await render(<ExtraPinKey message={message} messageVerification={messageVerification} />, false);

    return component;
};

describe('Extra pin key banner not displayed', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(clearAll);

    it('should not render the banner when sender has a PM address', async () => {
        const senderKey = await generateKeys('sender', 'sender@protonmail.com');
        const signingKey = await generateKeys('signing', 'sender@protonmail.com');

        const messageVerification = {
            signingPublicKey: signingKey.publicKeys[0],
            senderPinnedKeys: [...senderKey.publicKeys] as PublicKeyReference[],
            verificationStatus: SIGNED_AND_VALID,
        } as MessageVerification;

        const { queryByTestId } = await setup(message, messageVerification, true);
        const banner = queryByTestId('extra-pin-key:banner');

        expect(banner).toBeNull();
    });

    it.each`
        verificationStatus
        ${NOT_SIGNED}
        ${NOT_VERIFIED}
        ${SIGNED_AND_INVALID}
    `('should not render the banner when signing public key is already pinned', async ({ verificationStatus }) => {
        const senderKey = await generateKeys('sender', message.Sender.Address);

        const messageVerification = {
            senderPinnedKeys: [...senderKey.publicKeys] as PublicKeyReference[],
            attachedPublicKeys: [...senderKey.publicKeys] as PublicKeyReference[],
            verificationStatus,
        } as MessageVerification;

        const { queryByTestId } = await setup(message, messageVerification);
        const banner = queryByTestId('extra-pin-key:banner');

        expect(banner).toBeNull();
    });
});

describe('Extra pin key banner displayed', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(clearAll);

    const openTrustKeyModal = async (getByText: (text: Matcher) => HTMLElement) => {
        const trustKeyButton = getByText('Trust key');
        fireEvent.click(trustKeyButton);
        await tick();

        // Trust public key modal is open
        getByText('Trust public key?');
    };

    // AUTOPROMPT
    it.each`
        verificationStatus    | shouldDisablePrompt
        ${NOT_VERIFIED}       | ${true}
        ${NOT_VERIFIED}       | ${false}
        ${SIGNED_AND_INVALID} | ${true}
        ${SIGNED_AND_INVALID} | ${false}
    `(
        'should render the banner when prompt key pinning is AUTOPROMPT',
        async ({ verificationStatus, shouldDisablePrompt }) => {
            const signingKey = await generateKeys('signing', message.Sender.Address);

            const messageVerification = {
                signingPublicKey: signingKey.publicKeys[0],
                verificationStatus,
            } as MessageVerification;

            const { getByTestId, getByText } = await setup(message, messageVerification, false, true);
            getByTestId('extra-pin-key:banner');
            // Expected text is displayed
            getByText("This sender's public key has not been trusted yet.");

            // Test disable prompt button
            if (shouldDisablePrompt) {
                const updateSpy = jest.fn(() => Promise.resolve({}));
                addApiMock('mail/v4/settings/promptpin', updateSpy, 'put');

                const disableAutopromtButton = getByText('Never show');
                fireEvent.click(disableAutopromtButton);
                await tick();

                expect(updateSpy).toBeCalled();
            } else {
                // Open trust public key modal and trust the key
                await openTrustKeyModal(getByText);
            }
        }
    );

    // PIN_UNSEEN
    it('should render the banner when prompt key pinning is PIN_UNSEEN', async () => {
        const senderKey = await generateKeys('sender', message.Sender.Address);
        const signingKey = await generateKeys('signing', message.Sender.Address);

        const messageVerification = {
            signingPublicKey: signingKey.publicKeys[0],
            senderPinnedKeys: [...senderKey.publicKeys] as PublicKeyReference[],
            senderPinnableKeys: [...signingKey.publicKeys] as PublicKeyReference[],
            verificationStatus: NOT_VERIFIED,
        } as MessageVerification;

        const { getByTestId, getByText } = await setup(message, messageVerification);
        getByTestId('extra-pin-key:banner');
        // Expected text is displayed
        getByText('This message is signed by a key that has not been trusted yet.');

        await openTrustKeyModal(getByText);
    });

    it('should not render the banner when prompt key pinning is PIN_UNSEEN but the signature is invalid', async () => {
        const senderKey = await generateKeys('sender', message.Sender.Address);
        const signingKey = await generateKeys('signing', message.Sender.Address);

        const messageVerification = {
            signingPublicKey: signingKey.publicKeys[0],
            senderPinnedKeys: [...senderKey.publicKeys] as PublicKeyReference[],
            verificationStatus: SIGNED_AND_INVALID,
        } as MessageVerification;

        const { queryByTestId } = await setup(message, messageVerification);
        expect(queryByTestId('extra-pin-key:banner')).toBeNull();
    });

    // PIN_ATTACHED_SIGNING
    it.each`
        verificationStatus
        ${NOT_VERIFIED}
        ${SIGNED_AND_INVALID}
    `('should render the banner when prompt key pinning is PIN_ATTACHED_SIGNING', async ({ verificationStatus }) => {
        const signingKey = await generateKeys('signing', message.Sender.Address);

        const messageVerification = {
            signingPublicKey: signingKey.publicKeys[0],
            attachedPublicKeys: [...signingKey.publicKeys] as PublicKeyReference[],
            verificationStatus,
        } as MessageVerification;

        const { getByTestId, getByText } = await setup(message, messageVerification);
        getByTestId('extra-pin-key:banner');
        // Expected text is displayed
        getByText('This message is signed by the key attached, that has not been trusted yet.');

        await openTrustKeyModal(getByText);
    });

    // PIN_ATTACHED
    it.each`
        verificationStatus    | hasSigningKey
        ${NOT_SIGNED}         | ${false}
        ${NOT_SIGNED}         | ${true}
        ${NOT_VERIFIED}       | ${false}
        ${SIGNED_AND_INVALID} | ${false}
    `(
        'should render the banner when prompt key pinning is PIN_ATTACHED',
        async ({ verificationStatus, hasSigningKey }) => {
            const signingKey = await generateKeys('signing', message.Sender.Address);

            const messageVerification = {
                signingPublicKey: hasSigningKey ? signingKey.publicKeys[0] : undefined,
                attachedPublicKeys: [...signingKey.publicKeys] as PublicKeyReference[],
                verificationStatus,
            } as MessageVerification;

            const { getByTestId, getByText } = await setup(message, messageVerification, false, true);
            getByTestId('extra-pin-key:banner');
            // Expected text is displayed
            getByText('An unknown public key has been detected for this recipient.');

            await openTrustKeyModal(getByText);
        }
    );
});
