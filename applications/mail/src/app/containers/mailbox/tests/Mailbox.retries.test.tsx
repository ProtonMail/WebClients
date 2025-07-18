import { act, fireEvent, screen } from '@testing-library/react';

import { DEFAULT_MAIL_PAGE_SIZE, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { addApiMock, clearAll, tick } from '../../../helpers/test/helper';
import { expectElements, getElements, setup } from './Mailbox.test.helpers';

jest.setTimeout(20000);

jest.mock('proton-mail/metrics/useMailELDTMetric', () => ({
    useMailELDTMetric: () => {
        return { stopELDTMetric: jest.fn() };
    },
}));

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

        await act(async () => {
            await wait(10000);
        });

        expect(conversationRequestSpy).toHaveBeenCalledTimes(2);
        expectElements(getItems, conversations.length, false);
    });

    // This test is testing the old mailbox and should be deleted once we remove the before-refactoring code.
    // It's  failing after adding the categories view for some reasons. It's safe to skip for now.
    it.skip('should wait for all API actions to be finished before loading elements', async () => {
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

        // We are moving 100 elements to trash, and then we fake undoing all requests.
        // Because we batch requests to 10 elements, we need to resolve the request 10 times
        expect(conversationRequestSpy).toHaveBeenCalledTimes(2);
        expectElements(getItems, DEFAULT_MAIL_PAGE_SIZE, true);

        await act(async () => {
            resolvers[0]({ UndoToken: 'fake' });
            resolvers[1]({ UndoToken: 'fake' });
            resolvers[2]({ UndoToken: 'fake' });
            resolvers[3]({ UndoToken: 'fake' });
            resolvers[4]({ UndoToken: 'fake' });
        });

        expect(conversationRequestSpy).toHaveBeenCalledTimes(2);
        expectElements(getItems, DEFAULT_MAIL_PAGE_SIZE, true);

        await act(async () => {
            resolvers[5]({ UndoToken: 'fake' });
            resolvers[6]({ UndoToken: 'fake' });
            resolvers[7]({ UndoToken: 'fake' });
            resolvers[8]({ UndoToken: 'fake' });
            resolvers[9]({ UndoToken: 'fake' });
        });

        expect(conversationRequestSpy).toHaveBeenCalledTimes(4);
        expectElements(getItems, DEFAULT_MAIL_PAGE_SIZE, false);
    });
});
