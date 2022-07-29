import { EOGetHistory, EORender } from '../../helpers/test/eo/EORender';
import { EOClearAll } from '../../helpers/test/eo/helpers';
import { MessageState } from '../../logic/messages/messagesTypes';
import EORedirect from './EORedirect';

describe('Encrypted Outside Redirection', () => {
    afterEach(EOClearAll);

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

        await EORender(<EORedirect {...props} />, '/eo/message/:id');

        // Redirects to /eo
        const history = EOGetHistory();
        expect(history.location.pathname).toBe(`/eo`);
    });

    it('should redirect to Unlock page from /reply if no id', async () => {
        const props = getProps();

        await EORender(<EORedirect {...props} />, '/eo/reply/:id');

        // Redirects to /eo
        const history = EOGetHistory();
        expect(history.location.pathname).toBe(`/eo`);
    });

    it('should redirect to Unlock page from /message if invalid id', async () => {
        const props = getProps('invalidID');

        await EORender(<EORedirect {...props} />, '/eo/message/:id');

        // Redirects to /eo
        const history = EOGetHistory();
        expect(history.location.pathname).toBe(`/eo`);
    });

    it('should redirect to Unlock page from /reply if invalid id', async () => {
        const props = getProps('invalidID');

        await EORender(<EORedirect {...props} />, '/eo/reply/:id');

        // Redirects to /eo
        const history = EOGetHistory();
        expect(history.location.pathname).toBe(`/eo`);
    });
});
