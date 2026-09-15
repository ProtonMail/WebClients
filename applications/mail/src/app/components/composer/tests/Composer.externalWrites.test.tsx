import { act } from '@testing-library/react';

import { getModelState } from '@proton/account/tests';
import { parseDOMStringToBodyElement } from '@proton/mail/helpers/parseDOMStringToBodyElement';
import { MIME_TYPES } from '@proton/shared/lib/constants';

import { getCompleteAddress } from '../../../helpers/tests/cache';
import type { GeneratedKey } from '../../../helpers/tests/crypto';
import {
    addApiKeys,
    generateKeys,
    getAddressKeyCache,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../../helpers/tests/crypto';
import { clearAll } from '../../../helpers/tests/helper';
import { tick } from '../../../helpers/tests/render';
import { AddressID, ID, fromAddress, renderComposer, toAddress } from './Composer.test.helpers';

jest.setTimeout(20000);

const SIGNATURE = '<div class="protonmail_signature_block">Alice</div>';
const QUOTE = '<blockquote class="protonmail_quote">The original message</blockquote>';

/** Past `updateDraftContent`'s 300ms debounce, after which the store holds the write. */
const CONTENT_DEBOUNCE = 400;

/** One suite: each case needs a fully rendered composer, which is expensive. */
describe('Composer writes reachable from outside it', () => {
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

    const setup = async () => {
        const address = getCompleteAddress({ ID: AddressID, Email: fromAddress, Signature: '<div>Alice</div>' });
        const rendered = await renderComposer({
            preloadedState: {
                addresses: getModelState([address]),
                addressKeys: getAddressKeyCache(address, [fromKeys]),
            },
            message: {
                localID: ID,
                data: { ID: undefined, MIMEType: MIME_TYPES.DEFAULT, Sender: { Name: '', Address: fromAddress } },
                messageDocument: {
                    document: parseDOMStringToBodyElement(`<div>What I typed</div>${SIGNATURE}${QUOTE}`),
                },
            },
        });

        // The editor reports itself ready on mount, and the body-writer registration waits for that.
        await act(async () => {
            await tick();
        });

        return rendered;
    };

    const settle = async (work: () => void) => {
        await act(async () => {
            work();
            jest.advanceTimersByTime(CONTENT_DEBOUNCE);
            await tick();
        });
    };

    const storedBody = (store: Awaited<ReturnType<typeof setup>>['store']) =>
        store.getState().messages[ID]?.messageDocument?.document?.innerHTML ?? '';

    describe('the body writer, published for as long as it is safe to write through', () => {
        // Signature/quote splitting is setMessageContentBeforeBlockquote's contract, tested in contentFromComposerMessage.test.ts.
        it('is registered once the editor is ready, and writes the body it is given', async () => {
            const { writers, composerID, store } = await setup();

            expect(writers.get(composerID)).toBeDefined();

            await settle(() => writers.get(composerID)!.write('Lumo wrote this'));

            expect(storedBody(store)).toContain('Lumo wrote this');
            expect(storedBody(store)).not.toContain('What I typed');
        });

        it('is withdrawn when the composer unmounts', async () => {
            const { writers, composerID, unmount } = await setup();

            act(() => {
                unmount();
            });

            expect(writers.get(composerID)).toBeUndefined();
        });
    });
});
