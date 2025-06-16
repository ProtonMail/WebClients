import { act } from '@testing-library/react';

import { addApiMock, clearAll } from '../../../helpers/test/helper';
import { expectElements, getElements, props, setup } from './Mailbox.test.helpers';

jest.mock('proton-mail/metrics/useMailELDTMetric', () => ({
    useMailELDTMetric: () => ({ stopELDTMetric: jest.fn() }),
}));

describe('Mailbox list rendering states', () => {
    const { labelID } = props;
    const total = 2;

    beforeEach(clearAll);

    it('should render limited skeleton based on Labels API total, then final list with exactly 2 items', async () => {
        const conversations = getElements(total, labelID);
        let resolveConversationsCall: (value: any) => void;

        const conversationRequestSpy = jest.fn(() => {
            return new Promise((resolve) => {
                resolveConversationsCall = resolve;
            });
        });

        addApiMock('mail/v4/conversations', conversationRequestSpy);

        const { getItems } = await setup({
            totalConversations: total,
            mockConversations: false,
        });

        // Should show exactly 2 placeholders based on known total count
        expectElements(getItems, total, true);

        // Resolve conversations API call with actual conversations
        await act(async () => {
            resolveConversationsCall({ Total: total, Conversations: conversations });
        });

        // Should show exactly 2 real items
        expectElements(getItems, total, false);

        const items = getItems();
        expect(items.length).toBe(2);

        const renderedIds = items.map((item) => item.getAttribute('data-element-id'));
        const expectedIds = conversations.map((conv) => conv.ID);
        expect(renderedIds.sort()).toEqual(expectedIds.sort());

        expect(conversationRequestSpy).toHaveBeenCalledTimes(1);
    });
});
