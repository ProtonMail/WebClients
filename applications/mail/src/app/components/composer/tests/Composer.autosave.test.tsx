import { act, fireEvent, getByTestId } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { ROOSTER_EDITOR_ID } from '@proton/components/components/editor/constants';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { getAddressKeyCache, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../helpers/test/crypto';
import type { GeneratedKey } from '../../../helpers/test/helper';
import {
    addApiKeys,
    addApiMock,
    clearAll,
    generateKeys,
    getCompleteAddress,
    parseDOMStringToBodyElement,
    tick,
    waitForSpyCall,
} from '../../../helpers/test/helper';
import { AddressID, ID, fromAddress, renderComposer, toAddress } from './Composer.test.helpers';

jest.setTimeout(20000);

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
            act(() => {
                fireEvent.input(editor, 'hello');
            });
        }
    };

    const setup = async (resolved = true) => {
        const address = getCompleteAddress({ ID: AddressID, Email: fromAddress });
        const { container, store, ...renderResult } = await renderComposer({
            preloadedState: {
                addresses: getModelState([address]),
                addressKeys: getAddressKeyCache(address, [fromKeys]),
            },
            message: {
                data: { ID: undefined, MIMEType: MIME_TYPES.DEFAULT },
                messageDocument: { document: parseDOMStringToBodyElement('test') },
            },
        });

        triggerRoosterInput(container); // Initial dummy Squire input
        const { spy: createSpy, resolve: createResolve } = asyncSpy(resolved);
        const { spy: updateSpy, resolve: updateResolve } = asyncSpy(resolved);
        const { spy: sendSpy, resolve: sendResolve } = asyncSpy(resolved);
        addApiMock(`mail/v4/messages`, createSpy, 'post');
        addApiMock(`mail/v4/messages/undefined`, updateSpy, 'put'); // Should be /ID
        addApiMock(`mail/v4/messages/${ID}`, sendSpy, 'post'); // Should be /ID
        return { ...renderResult, container, createSpy, updateSpy, sendSpy, createResolve, updateResolve, sendResolve };
    };

    it('should wait 2s before saving a change', async () => {
        const { createSpy, container } = await setup();

        await act(async () => {
            triggerRoosterInput(container);
        });

        await act(async () => {
            jest.advanceTimersByTime(1500);
            await tick();
        });

        expect(createSpy).not.toHaveBeenCalled();
        await act(async () => {
            jest.advanceTimersByTime(1500);
            await tick();
        });
        await waitForSpyCall({ spy: createSpy, disableFakeTimers: true });
    });

    it('should wait 2s after the last change before saving a change', async () => {
        const { createSpy, container } = await setup();

        triggerRoosterInput(container);
        await act(async () => {
            jest.advanceTimersByTime(1500);
            await tick();
        });
        triggerRoosterInput(container);
        await act(async () => {
            jest.advanceTimersByTime(1500);
            await tick();
        });
        expect(createSpy).not.toHaveBeenCalled();
        await act(async () => {
            jest.advanceTimersByTime(1500);
            await tick();
        });

        await waitForSpyCall({ spy: createSpy, disableFakeTimers: true });
    });

    it('should wait 2s after previous save resolved before saving a change', async () => {
        const { createSpy, createResolve, updateSpy, container } = await setup(false);

        triggerRoosterInput(container);
        await act(async () => {
            jest.advanceTimersByTime(1500);
            await tick();
        });
        expect(createSpy).not.toHaveBeenCalled();
        await act(async () => {
            jest.advanceTimersByTime(1500);
            await tick();
        });
        await waitForSpyCall({ spy: createSpy, disableFakeTimers: true });
        triggerRoosterInput(container);
        await act(async () => {
            jest.advanceTimersByTime(1500);
            await tick();
        });
        expect(updateSpy).not.toHaveBeenCalled();
        await act(async () => {
            jest.advanceTimersByTime(1500);
            await tick();
        });
        expect(updateSpy).not.toHaveBeenCalled();
        createResolve({ Message: { ID } });
        await act(async () => {
            jest.advanceTimersByTime(1500);
            await tick();
        });
        expect(updateSpy).not.toHaveBeenCalled();
        await act(async () => {
            jest.advanceTimersByTime(1500);
            await tick();
        });
        await waitForSpyCall({ spy: updateSpy, disableFakeTimers: true });
    });

    it('should wait previous save before sending', async () => {
        const { createSpy, createResolve, sendSpy, container, ...renderResult } = await setup(false);

        triggerRoosterInput(container);
        await act(async () => {
            jest.advanceTimersByTime(1500);
            await tick();
        });
        const sendButton = await renderResult.findByTestId('composer:send-button');
        fireEvent.click(sendButton);
        await act(async () => {
            jest.advanceTimersByTime(1500);
            await tick();
        });
        await waitForSpyCall({ spy: createSpy, disableFakeTimers: true });
        expect(sendSpy).not.toHaveBeenCalled();
        createResolve({ Message: { ID, AddressID, Attachments: [] } });
        await waitForSpyCall({ spy: sendSpy, disableFakeTimers: true });
    });
});
