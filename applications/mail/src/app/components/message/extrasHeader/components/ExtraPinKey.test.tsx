import { fireEvent, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import type { PublicKeyReference } from '@proton/crypto';
import type { MessageVerification } from '@proton/mail/store/messages/messagesTypes';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';
import { PROMPT_PIN } from '@proton/shared/lib/mail/mailSettings';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../helpers/test/crypto';
import {
    addApiMock,
    clearAll,
    generateKeys,
    getCompleteAddress,
    mailTestRender,
    minimalCache,
    tick,
} from '../../../../helpers/test/helper';
import { message } from '../../../../helpers/test/pinKeys';
import ExtraPinKey from './ExtraPinKey';

const setup = async (
    message: Message,
    messageVerification: MessageVerification,
    isOwnAddress = false,
    isAutoPrompt = false
) => {
    minimalCache();

    await mailTestRender(<ExtraPinKey message={message} messageVerification={messageVerification} />, {
        preloadedState: {
            addresses: getModelState(isOwnAddress ? [getCompleteAddress({ Email: 'sender@protonmail.com' })] : []),
            mailSettings: getModelState({
                PromptPin: isAutoPrompt ? PROMPT_PIN.ENABLED : PROMPT_PIN.DISABLED,
            } as MailSettings),
        },
    });
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
            verificationStatus: MAIL_VERIFICATION_STATUS.SIGNED_AND_VALID,
        } as MessageVerification;

        await setup(message, messageVerification, true);
        const banner = screen.queryByTestId('extra-pin-key:banner');

        expect(banner).toBeNull();
    });

    it.each`
        verificationStatus
        ${MAIL_VERIFICATION_STATUS.NOT_SIGNED}
        ${MAIL_VERIFICATION_STATUS.NOT_VERIFIED}
        ${MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID}
    `('should not render the banner when signing public key is already pinned', async ({ verificationStatus }) => {
        const senderKey = await generateKeys('sender', message.Sender.Address);

        const messageVerification = {
            senderPinnedKeys: [...senderKey.publicKeys] as PublicKeyReference[],
            attachedPublicKeys: [...senderKey.publicKeys] as PublicKeyReference[],
            verificationStatus,
        } as MessageVerification;

        await setup(message, messageVerification);
        const banner = screen.queryByTestId('extra-pin-key:banner');

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

    const openTrustKeyModal = async () => {
        const trustKeyButton = screen.getByText('Trust key');
        fireEvent.click(trustKeyButton);
        await tick();

        // Trust public key modal is open
        screen.getByText('Trust public key?');
    };

    // AUTOPROMPT
    it.each`
        verificationStatus                             | shouldDisablePrompt
        ${MAIL_VERIFICATION_STATUS.NOT_VERIFIED}       | ${true}
        ${MAIL_VERIFICATION_STATUS.NOT_VERIFIED}       | ${false}
        ${MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID} | ${true}
        ${MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID} | ${false}
    `(
        'should render the banner when prompt key pinning is AUTOPROMPT',
        async ({ verificationStatus, shouldDisablePrompt }) => {
            const signingKey = await generateKeys('signing', message.Sender.Address);

            const messageVerification = {
                signingPublicKey: signingKey.publicKeys[0],
                verificationStatus,
            } as MessageVerification;

            await setup(message, messageVerification, false, true);
            screen.getByTestId('extra-pin-key:banner');
            // Expected text is displayed
            screen.getByText("This sender's public key has not been trusted yet.");

            // Test disable prompt button
            if (shouldDisablePrompt) {
                const updateSpy = jest.fn(() => Promise.resolve({}));
                addApiMock('mail/v4/settings/promptpin', updateSpy, 'put');

                const disableAutopromtButton = screen.getByText('Never show');
                fireEvent.click(disableAutopromtButton);
                await tick();

                expect(updateSpy).toBeCalled();
            } else {
                // Open trust public key modal and trust the key
                await openTrustKeyModal();
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
            verificationStatus: MAIL_VERIFICATION_STATUS.NOT_VERIFIED,
        } as MessageVerification;

        await setup(message, messageVerification);
        screen.getByTestId('extra-pin-key:banner');
        // Expected text is displayed
        screen.getByText('This message is signed by a key that has not been trusted yet.');

        await openTrustKeyModal();
    });

    it('should not render the banner when prompt key pinning is PIN_UNSEEN but the signature is invalid', async () => {
        const senderKey = await generateKeys('sender', message.Sender.Address);
        const signingKey = await generateKeys('signing', message.Sender.Address);

        const messageVerification = {
            signingPublicKey: signingKey.publicKeys[0],
            senderPinnedKeys: [...senderKey.publicKeys] as PublicKeyReference[],
            verificationStatus: MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID,
        } as MessageVerification;

        await setup(message, messageVerification);
        expect(screen.queryByTestId('extra-pin-key:banner')).toBeNull();
    });

    // PIN_ATTACHED_SIGNING
    it.each`
        verificationStatus
        ${MAIL_VERIFICATION_STATUS.NOT_VERIFIED}
        ${MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID}
    `('should render the banner when prompt key pinning is PIN_ATTACHED_SIGNING', async ({ verificationStatus }) => {
        const signingKey = await generateKeys('signing', message.Sender.Address);

        const messageVerification = {
            signingPublicKey: signingKey.publicKeys[0],
            attachedPublicKeys: [...signingKey.publicKeys] as PublicKeyReference[],
            verificationStatus,
        } as MessageVerification;

        await setup(message, messageVerification);
        screen.getByTestId('extra-pin-key:banner');
        // Expected text is displayed
        screen.getByText('This message is signed by the key attached, that has not been trusted yet.');

        await openTrustKeyModal();
    });

    // PIN_ATTACHED
    it.each`
        verificationStatus                             | hasSigningKey
        ${MAIL_VERIFICATION_STATUS.NOT_SIGNED}         | ${false}
        ${MAIL_VERIFICATION_STATUS.NOT_SIGNED}         | ${true}
        ${MAIL_VERIFICATION_STATUS.NOT_VERIFIED}       | ${false}
        ${MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID} | ${false}
    `(
        'should render the banner when prompt key pinning is PIN_ATTACHED',
        async ({ verificationStatus, hasSigningKey }) => {
            const signingKey = await generateKeys('signing', message.Sender.Address);

            const messageVerification = {
                signingPublicKey: hasSigningKey ? signingKey.publicKeys[0] : undefined,
                attachedPublicKeys: [...signingKey.publicKeys] as PublicKeyReference[],
                verificationStatus,
            } as MessageVerification;

            await setup(message, messageVerification, false, true);
            screen.getByTestId('extra-pin-key:banner');
            // Expected text is displayed
            screen.getByText('An unknown public key has been detected for this recipient.');

            await openTrustKeyModal();
        }
    );
});
