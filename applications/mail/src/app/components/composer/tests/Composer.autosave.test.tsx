import { fireEvent, getByTestId, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';

import { ROOSTER_EDITOR_ID } from '@proton/components/components/editor/constants';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import {
    GeneratedKey,
    addApiKeys,
    addApiMock,
    addKeysToAddressKeysCache,
    clearAll,
    createDocument,
    generateKeys,
} from '../../../helpers/test/helper';
import { store } from '../../../logic/store';
import { AddressID, ID, fromAddress, prepareMessage, renderComposer, toAddress } from './Composer.test.helpers';

jest.setTimeout(20000);

/**
 * Those tests are slow, I'm sorry for that
 * But I found no way of making jest fake timers works (at least with the composer)
 */

describe('Composer autosave', () => {
    let fromKeys: GeneratedKey;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        fromKeys = await generateKeys('me', fromAddress);
    });

    afterAll(async () => {
        clearAll();
        await releaseCryptoProxy();
    });

    beforeEach(() => {
        clearAll();
        jest.useFakeTimers();
        addKeysToAddressKeysCache(AddressID, fromKeys);
        addApiKeys(false, toAddress, []);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const asyncSpy = (resolved = true) => {
        let resolve: (value: unknown) => void = noop;
        let reject: (value: unknown) => void = noop;
        const spy = jest.fn(() => {
            if (resolved) {
                return Promise.resolve({ Message: { ID } });
            }
            return new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            });
        });
        return { spy, resolve: (value: unknown) => resolve(value), reject: (value: unknown) => reject(value) };
    };

    const triggerRoosterInput = (container: HTMLElement) => {
        const iframe = getByTestId(container, 'rooster-iframe') as HTMLIFrameElement;
        const editor = iframe.contentDocument?.getElementById(ROOSTER_EDITOR_ID);

        if (editor) {
            fireEvent.input(editor, 'hello');
        }
    };

    const setup = async (resolved = true) => {
        prepareMessage({
            data: { ID: undefined, MIMEType: MIME_TYPES.DEFAULT },
            messageDocument: { document: createDocument('test') },
        });
        const composerID = Object.keys(store.getState().composers.composers)[0];

        const renderResult = await renderComposer(composerID);
        triggerRoosterInput(renderResult.container); // Initial dummy Squire input
        const { spy: createSpy, resolve: createResolve } = asyncSpy(resolved);
        const { spy: updateSpy, resolve: updateResolve } = asyncSpy(resolved);
        const { spy: sendSpy, resolve: sendResolve } = asyncSpy(resolved);
        addApiMock(`mail/v4/messages`, createSpy, 'post');
        addApiMock(`mail/v4/messages/undefined`, updateSpy, 'put'); // Should be /ID
        addApiMock(`mail/v4/messages/${ID}`, sendSpy, 'post'); // Should be /ID
        return { ...renderResult, createSpy, updateSpy, sendSpy, createResolve, updateResolve, sendResolve };
    };

    const waitForSpy = (spy: jest.Mock<Promise<unknown>, []>) =>
        waitFor(
            () => {
                expect(spy).toHaveBeenCalled();
            },
            { timeout: 10000 }
        );

    it('should wait 2s before saving a change', async () => {
        const { createSpy, container } = await setup();

        await act(async () => {
            triggerRoosterInput(container);
            jest.advanceTimersByTime(1500);
            expect(createSpy).not.toHaveBeenCalled();
            jest.advanceTimersByTime(1500);
            await waitForSpy(createSpy);
        });
    });

    it('should wait 2s after the last change before saving a change', async () => {
        const { createSpy, container } = await setup();

        await act(async () => {
            triggerRoosterInput(container);
            jest.advanceTimersByTime(1500);
            triggerRoosterInput(container);
            jest.advanceTimersByTime(1500);
            expect(createSpy).not.toHaveBeenCalled();
            jest.advanceTimersByTime(1500);
            await waitForSpy(createSpy);
        });
    });

    it('should wait 2s after previous save resolved before saving a change', async () => {
        const { createSpy, createResolve, updateSpy, container } = await setup(false);

        await act(async () => {
            triggerRoosterInput(container);
            jest.advanceTimersByTime(1500);
            expect(createSpy).not.toHaveBeenCalled();
            jest.advanceTimersByTime(1500);
            await waitForSpy(createSpy);
            triggerRoosterInput(container);
            jest.advanceTimersByTime(1500);
            expect(updateSpy).not.toHaveBeenCalled();
            jest.advanceTimersByTime(1500);
            expect(updateSpy).not.toHaveBeenCalled();
            createResolve({ Message: { ID } });
            jest.advanceTimersByTime(1500);
            expect(updateSpy).not.toHaveBeenCalled();
            jest.advanceTimersByTime(1500);
            await waitForSpy(updateSpy);
        });
    });

    it('should wait previous save before sending', async () => {
        jest.useFakeTimers();

        const { createSpy, createResolve, sendSpy, container, ...renderResult } = await setup(false);

        await act(async () => {
            triggerRoosterInput(container);
            jest.advanceTimersByTime(1500);
            const sendButton = await renderResult.findByTestId('composer:send-button');
            fireEvent.click(sendButton);
            jest.advanceTimersByTime(1500);
            await waitForSpy(createSpy);
            expect(sendSpy).not.toHaveBeenCalled();
            createResolve({ Message: { ID, Attachments: [] } });
            await waitForSpy(sendSpy);
        });
    });
});
