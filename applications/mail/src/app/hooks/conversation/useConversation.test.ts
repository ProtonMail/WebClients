import { act } from '@testing-library/react-hooks';
import { wait } from 'proton-shared/lib/helpers/promise';

import { useConversation } from './useConversation';
import { renderHook, clearAll, addApiMock, conversationCache } from '../../helpers/test/helper';

describe('useConversation', () => {
    const ID = 'ID';

    const setup = (argId?: string) => renderHook((rerenderId?: string) => useConversation(rerenderId || argId || ID));

    beforeEach(() => {
        jest.clearAllMocks();
        clearAll();
    });

    it('should return cache value', async () => {
        const reference = { Conversation: {}, Messages: [] };
        conversationCache.set(ID, reference);
        const hook = setup();
        expect(hook.result.current.conversation).toBe(reference);
    });

    it('should update value if cache is updated', async () => {
        const reference1 = { Conversation: {}, Messages: [] };
        conversationCache.set(ID, reference1);
        const hook = setup();
        expect(hook.result.current.conversation).toBe(reference1);

        const reference2 = { Conversation: {}, Messages: [] };
        await act(async () => {
            conversationCache.set(ID, reference2);
        });
        expect(hook.result.current.conversation).toBe(reference2);
    });

    it('should launch api request when needed', async () => {
        const response = { Conversation: {}, Messages: [] };
        addApiMock('mail/v4/conversations/ID', () => response);
        const hook = setup();
        expect(hook.result.current.conversation).toBe(undefined);
        await act(async () => wait(0));
        expect(hook.result.current.conversation).toBe(response);
    });

    it('should change conversation when id change', async () => {
        const ID2 = 'ID2';
        const reference1 = { Conversation: {}, Messages: [] };
        const reference2 = { Conversation: {}, Messages: [] };
        conversationCache.set(ID, reference1);
        conversationCache.set(ID2, reference2);
        const hook = setup();
        expect(hook.result.current.conversation).toBe(reference1);
        hook.rerender(ID2);
        expect(hook.result.current.conversation).toBe(reference2);
    });
});
