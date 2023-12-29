import { act, fireEvent, screen } from '@testing-library/react';

import { DEFAULT_MAIL_PAGE_SIZE, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { addApiMock, clearAll, tick } from '../../../helpers/test/helper';
import { expectElements, getElements, setup } from './Mailbox.test.helpers';

jest.setTimeout(20000);

describe('Mailbox retries and waitings', () => {
    beforeEach(clearAll);

    it('should retry when API call fails', async () => {
        const conversations = getElements(3);

        let callNumber = 0;
        const conversationRequestSpy = jest.fn(() => {
            callNumber++;
            if (callNumber === 1) {
                throw new Error('Test error');
            }
            return {
                Total: conversations.length,
                Conversations: conversations,
            };
        });
        addApiMock(`mail/v4/conversations`, conversationRequestSpy, 'get');

        const { getItems } = await setup({
            totalConversations: conversations.length,
        });

        expect(conversationRequestSpy).toHaveBeenCalledTimes(1);
        expectElements(getItems, conversations.length, true);

        await act(async () => {
            await wait(2000);
        });

        expect(conversationRequestSpy).toHaveBeenCalledTimes(2);
        expectElements(getItems, conversations.length, false);
    });

    it('should retry when API respond with stale flag', async () => {
        const conversations = getElements(3);

        let callNumber = 0;
        const conversationRequestSpy = jest.fn(() => {
            callNumber++;
            return {
                Total: conversations.length,
                Conversations: conversations,
                Stale: callNumber === 1 ? 1 : 0,
            };
        });
        addApiMock(`mail/v4/conversations`, conversationRequestSpy, 'get');

        const { getItems } = await setup({
            totalConversations: conversations.length,
        });

        expect(conversationRequestSpy).toHaveBeenCalledTimes(1);
        expectElements(getItems, conversations.length, false);

        await act(async () => {
            await wait(10000);
        });

        expect(conversationRequestSpy).toHaveBeenCalledTimes(2);
        expectElements(getItems, conversations.length, false);
    });

    it('should wait for all API actions to be finished before loading elements', async () => {
        const conversations = getElements(DEFAULT_MAIL_PAGE_SIZE * 2, MAILBOX_LABEL_IDS.INBOX);
        const totalConversations = DEFAULT_MAIL_PAGE_SIZE * 3;

        const conversationRequestSpy = jest.fn(() => {
            return { Total: totalConversations, Conversations: conversations };
        });
        addApiMock(`mail/v4/conversations`, conversationRequestSpy, 'get');

        let resolvers: ((value: any) => void)[] = [];
        const labelRequestSpy = jest.fn(() => {
            return new Promise((resolver) => {
                resolvers.push(resolver as any);
            });
        });
        addApiMock('mail/v4/conversations/label', labelRequestSpy, 'put');

        const { getItems } = await setup({
            labelID: MAILBOX_LABEL_IDS.INBOX,
            totalConversations,
            mockConversations: false,
        });

        const checkAll = screen.getByTestId('toolbar:select-all-checkbox');

        await act(async () => {
            fireEvent.click(checkAll);
            await tick();
            let trash = screen.getByTestId('toolbar:movetotrash');
            fireEvent.click(trash);
            await tick();
            // TODO fix later, needed for useMoveToFolder using getLabels
            await wait(0);
            fireEvent.click(checkAll);
            await tick();
            trash = screen.getByTestId('toolbar:movetotrash');
            fireEvent.click(trash);
            await tick();
        });

        // We are moving 100 elements to trash, and then we fake undoing all requests.
        // Because we batch requests to 25 elements, we need to resolve the request 4 times
        expect(conversationRequestSpy).toHaveBeenCalledTimes(2);
        expectElements(getItems, DEFAULT_MAIL_PAGE_SIZE, true);

        await act(async () => {
            resolvers[0]({ UndoToken: 'fake' });
            resolvers[1]({ UndoToken: 'fake' });
        });

        expect(conversationRequestSpy).toHaveBeenCalledTimes(2);
        expectElements(getItems, DEFAULT_MAIL_PAGE_SIZE, true);

        await act(async () => {
            resolvers[2]({ UndoToken: 'fake' });
            resolvers[3]({ UndoToken: 'fake' });
        });

        expect(conversationRequestSpy).toHaveBeenCalledTimes(4);
        expectElements(getItems, DEFAULT_MAIL_PAGE_SIZE, false);
    });
});
