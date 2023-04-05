import { fireEvent } from '@testing-library/react';

import { MIME_TYPES } from '@proton/shared/lib/constants';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import {
    GeneratedKey,
    addApiKeys,
    addApiMock,
    addKeysToAddressKeysCache,
    addToCache,
    clearAll,
    clearCache,
    createDocument,
    generateKeys,
    minimalCache,
    waitForNotification,
} from '../../../helpers/test/helper';
import { store } from '../../../logic/store';
import { AddressID, ID, fromAddress, prepareMessage, renderComposer, toAddress } from './Composer.test.helpers';

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
        if (hasShortcutsEnabled) {
            addToCache('MailSettings', { Shortcuts: 1 });
        } else {
            addToCache('MailSettings', { Shortcuts: 0 });
        }

        addKeysToAddressKeysCache(AddressID, fromKeys);

        prepareMessage({
            messageDocument: { document: createDocument('test') },
            data: { MIMEType: MIME_TYPES.DEFAULT },
        });

        addApiKeys(false, toAddress, []);

        const composerID = Object.keys(store.getState().composers.composers)[0];

        const result = await renderComposer(composerID, false);

        const iframe = result.container.querySelector('iframe') as HTMLIFrameElement;

        return {
            ...result,
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
