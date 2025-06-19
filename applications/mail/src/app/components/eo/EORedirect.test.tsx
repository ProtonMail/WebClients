import type { MessageState } from '@proton/mail/store/messages/messagesTypes';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from 'proton-mail/helpers/test/crypto';

import { EORender } from '../../helpers/test/eo/EORender';
import { EOClearAll } from '../../helpers/test/eo/helpers';
import EORedirect from './EORedirect';

describe('Encrypted Outside Redirection', () => {
    afterEach(EOClearAll);
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    const getProps = (id?: string) => {
        return {
            id: id ? id : undefined,
            isStoreInitialized: true,
            messageState: {} as MessageState,
            setSessionStorage: jest.fn(),
        };
    };

    it('should redirect to Unlock page from /message if no id', async () => {
        const props = getProps();

        const { history } = await EORender(<EORedirect {...props} />, { routePath: '/eo/message/:id' });

        // Redirects to /eo
        expect(history.location.pathname).toBe(`/eo`);
    });

    it('should redirect to Unlock page from /reply if no id', async () => {
        const props = getProps();

        const { history } = await EORender(<EORedirect {...props} />, { routePath: '/eo/reply/:id' });

        // Redirects to /eo
        expect(history.location.pathname).toBe(`/eo`);
    });

    it('should redirect to Unlock page from /message if invalid id', async () => {
        const props = getProps('invalidID');

        const { history } = await EORender(<EORedirect {...props} />, { routePath: '/eo/message/:id' });

        // Redirects to /eo
        expect(history.location.pathname).toBe(`/eo`);
    });

    it('should redirect to Unlock page from /reply if invalid id', async () => {
        const props = getProps('invalidID');

        const { history } = await EORender(<EORedirect {...props} />, { routePath: '/eo/reply/:id' });

        // Redirects to /eo
        expect(history.location.pathname).toBe(`/eo`);
    });
});
