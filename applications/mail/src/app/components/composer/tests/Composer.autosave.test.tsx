import { noop } from '@proton/shared/lib/helpers/function';
import { wait } from '@proton/shared/lib/helpers/promise';
import { act } from '@testing-library/react';
import { fireEvent, getByTestId } from '@testing-library/dom';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { ROOSTER_EDITOR_ID } from '@proton/components/components/editor/constants';
import {
    clearAll,
    GeneratedKey,
    generateKeys,
    addKeysToAddressKeysCache,
    addApiMock,
    addApiKeys,
    createDocument,
} from '../../../helpers/test/helper';
import { ID, AddressID, prepareMessage, renderComposer, fromAddress, toAddress } from './Composer.test.helpers';

jest.setTimeout(20000);

/**
 * Those tests are slow, I'm sorry for that
 * But I found no way of making jest fake timers works (at least with the composer)
 */

describe('Composer autosave', () => {
    let fromKeys: GeneratedKey;

    beforeAll(async () => {
        fromKeys = await generateKeys('me', fromAddress);
    });

    beforeEach(() => {
        addKeysToAddressKeysCache(AddressID, fromKeys);
        addApiKeys(false, toAddress, []);
    });

    afterEach(clearAll);

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
        const message = prepareMessage({
            data: { ID: undefined, MIMEType: MIME_TYPES.DEFAULT },
            messageDocument: { document: createDocument('test') },
        });
        const renderResult = await renderComposer(message.localID);
        triggerRoosterInput(renderResult.container); // Initial dummy Squire input
        const { spy: createSpy, resolve: createResolve } = asyncSpy(resolved);
        const { spy: updateSpy, resolve: updateResolve } = asyncSpy(resolved);
        const { spy: sendSpy, resolve: sendResolve } = asyncSpy(resolved);
        addApiMock(`mail/v4/messages`, createSpy, 'post');
        addApiMock(`mail/v4/messages/undefined`, updateSpy, 'put'); // Should be /ID
        addApiMock(`mail/v4/messages/${ID}`, sendSpy, 'post'); // Should be /ID
        return { ...renderResult, createSpy, updateSpy, sendSpy, createResolve, updateResolve, sendResolve };
    };

    it('should wait 2s before saving a change', async () => {
        const { createSpy, container } = await setup();

        await act(async () => {
            triggerRoosterInput(container);
            await wait(1500);
            expect(createSpy).not.toHaveBeenCalled();
            await wait(1500);
            expect(createSpy).toHaveBeenCalled();
        });
    });

    it('should wait 2s after the last change before saving a change', async () => {
        const { createSpy, container } = await setup();

        await act(async () => {
            triggerRoosterInput(container);
            await wait(1500);
            triggerRoosterInput(container);
            await wait(1500);
            expect(createSpy).not.toHaveBeenCalled();
            await wait(1500);
            expect(createSpy).toHaveBeenCalled();
        });
    });

    it('should wait 2s after previous save resolved before saving a change', async () => {
        const { createSpy, createResolve, updateSpy, container } = await setup(false);

        await act(async () => {
            triggerRoosterInput(container);
            await wait(1500);
            expect(createSpy).not.toHaveBeenCalled();
            await wait(1500);
            expect(createSpy).toHaveBeenCalled();
            triggerRoosterInput(container);
            await wait(1500);
            expect(updateSpy).not.toHaveBeenCalled();
            await wait(1500);
            expect(updateSpy).not.toHaveBeenCalled();
            createResolve({ Message: { ID } });
            await wait(1500);
            expect(updateSpy).not.toHaveBeenCalled();
            await wait(1500);
            expect(updateSpy).toHaveBeenCalled();
        });
    });

    it('should wait previous save before sending', async () => {
        const { createSpy, createResolve, sendSpy, container, ...renderResult } = await setup(false);

        await act(async () => {
            triggerRoosterInput(container);
            await wait(1500);
            const sendButton = await renderResult.findByTestId('composer:send-button');
            fireEvent.click(sendButton);
            await wait(1500);
            expect(sendSpy).not.toHaveBeenCalled();
            createResolve({ Message: { ID, Attachments: [] } });
            await wait(1500);
            expect(sendSpy).toHaveBeenCalled();
        });
    });
});
