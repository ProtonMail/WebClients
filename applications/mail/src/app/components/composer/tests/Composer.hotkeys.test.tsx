import { fireEvent } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { SHORTCUTS } from '@proton/shared/lib/mail/mailSettings';

import { getAddressKeyCache, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import type { GeneratedKey } from '../../../helpers/test/helper';
import {
    addApiKeys,
    addApiMock,
    clearAll,
    clearCache,
    generateKeys,
    getCompleteAddress,
    minimalCache,
    parseDOMStringToBodyElement,
    waitForNotification,
} from '../../../helpers/test/helper';
import { AddressID, ID, fromAddress, renderComposer, toAddress } from './Composer.test.helpers';

const orignalGetSelection = global.getSelection;

beforeAll(() => {
    global.getSelection = jest.fn();
});

afterAll(() => {
    global.getSelection = orignalGetSelection;
});

describe('Composer hotkeys', () => {
    let fromKeys: GeneratedKey;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        fromKeys = await generateKeys('me', fromAddress);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    afterEach(() => {
        clearCache();
    });

    beforeEach(clearAll);

    const setup = async (hasShortcutsEnabled = true) => {
        minimalCache();

        addApiKeys(false, toAddress, []);

        const address = getCompleteAddress({ ID: AddressID, Email: fromAddress });
        const { container, ...rest } = await renderComposer({
            preloadedState: {
                mailSettings: getModelState({
                    Shortcuts: hasShortcutsEnabled ? SHORTCUTS.ENABLED : SHORTCUTS.DISABLED,
                } as MailSettings),
                addressKeys: getAddressKeyCache(address, [fromKeys]),
                addresses: getModelState([address]),
            },
            message: {
                messageDocument: { document: parseDOMStringToBodyElement('test') },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            },
        });

        const iframe = container.querySelector('iframe') as HTMLIFrameElement;

        return {
            ...rest,
            container,
            iframe,
            esc: () => fireEvent.keyDown(iframe, { key: 'Escape' }),
            ctrlEnter: () => fireEvent.keyDown(iframe, { key: 'Enter', ctrlKey: true }),
            ctrlAltBackspace: () => fireEvent.keyDown(iframe, { key: 'Backspace', ctrlKey: true, altKey: true }),
            ctrlS: () => fireEvent.keyDown(iframe, { key: 'S', ctrlKey: true }),
            ctrlM: () => fireEvent.keyDown(iframe, { key: 'M', ctrlKey: true }),
            ctrlShftM: () => fireEvent.keyDown(iframe, { key: 'M', ctrlKey: true, shiftKey: true }),
            ctrlShftA: () => fireEvent.keyDown(iframe, { key: 'A', ctrlKey: true, shiftKey: true }),
            ctrlShftE: () => fireEvent.keyDown(iframe, { key: 'E', ctrlKey: true, shiftKey: true }),
            ctrlShftX: () => fireEvent.keyDown(iframe, { key: 'X', ctrlKey: true, shiftKey: true }),
        };
    };

    it('shortcut should not work when app shortcuts settings are disabled', async () => {
        const { container, esc } = await setup(false);

        esc();

        const composer = container.querySelector('.composer-container');

        expect(composer).not.toBe(null);
    });

    it('should close composer on escape', async () => {
        const { container, esc } = await setup();

        esc();

        const composer = container.querySelector('.composer-container');

        expect(composer).toBe(null);
    });

    it('should send on meta + enter', async () => {
        const { ctrlEnter } = await setup();

        const sendSpy = jest.fn(() => Promise.resolve({ Sent: {} }));
        addApiMock(`mail/v4/messages/${ID}`, sendSpy, 'post');

        ctrlEnter();

        await waitForNotification('Message sent');

        expect(sendSpy).toHaveBeenCalled();
    });

    it('should delete on meta + alt + enter', async () => {
        const deleteSpy = jest.fn(() => Promise.resolve({}));
        addApiMock(`mail/v4/messages/delete`, deleteSpy, 'put');

        const { ctrlAltBackspace } = await setup();

        ctrlAltBackspace();

        await waitForNotification('Draft discarded');

        expect(deleteSpy).toHaveBeenCalled();
    });

    it('should save on meta + S', async () => {
        const saveSpy = jest.fn(() => Promise.resolve({}));
        addApiMock(`mail/v4/messages/${ID}`, saveSpy, 'put');

        const { ctrlS } = await setup();

        ctrlS();

        await waitForNotification('Draft saved');

        expect(saveSpy).toHaveBeenCalled();
    });

    it('should open attachment on meta + shift + A', async () => {
        const { getByTestId, ctrlShftA } = await setup();

        const attachmentsButton = getByTestId('composer:attachment-button');
        const attachmentSpy = jest.fn();
        attachmentsButton.addEventListener('click', attachmentSpy);

        ctrlShftA();

        expect(attachmentSpy).toHaveBeenCalled();
    });

    it('should open encryption modal on meta + shift + E', async () => {
        const { findByText, ctrlShftE } = await setup();

        ctrlShftE();

        await findByText('Encrypt message');
    });

    it('should open encryption modal on meta + shift + X', async () => {
        const { findByText, ctrlShftX } = await setup();

        ctrlShftX();

        await findByText('Expiring message');
    });
});
