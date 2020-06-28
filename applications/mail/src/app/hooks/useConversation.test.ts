import { act } from '@testing-library/react-hooks';
import { wait } from 'proton-shared/lib/helpers/promise';

import { useConversation } from './useConversation';
import { renderHook, clearAll, addApiMock, conversationCache } from '../helpers/test/helper';

describe('useConversation', () => {
    const ID = 'ID';

    const setup = (argId?: string) => renderHook((rerenderId?: string) => useConversation(rerenderId || argId || ID));

    afterEach(() => {
        jest.clearAllMocks();
        clearAll();
    });

    it('should return cache value', () => {
        const reference = { Conversation: {} };
        conversationCache.set(ID, reference);
        const hook = setup();
        expect(hook.result.current[0]).toBe(reference);
    });

    it('should update value if cache is updated', async () => {
        const reference1 = { Conversation: {} };
        conversationCache.set(ID, reference1);
        const hook = setup();
        expect(hook.result.current[0]).toBe(reference1);

        const reference2 = { Conversation: {} };
        await act(async () => {
            conversationCache.set(ID, reference2);
        });
        expect(hook.result.current[0]).toBe(reference2);
    });

    it('should lauch api request when needed', async () => {
        const response = { Conversation: {} };
        addApiMock('conversations/ID', () => response);
        const hook = setup();
        expect(hook.result.current[0]).toBe(undefined);
        await act(async () => await wait(0));
        expect(hook.result.current[0]).toBe(response);
    });

    it('should change conversation when id change', async () => {
        const ID2 = 'ID2';
        const reference1 = { Conversation: {} };
        const reference2 = { Conversation: {} };
        conversationCache.set(ID, reference1);
        conversationCache.set(ID2, reference2);
        const hook = setup();
        expect(hook.result.current[0]).toBe(reference1);
        hook.rerender(ID2);
        expect(hook.result.current[0]).toBe(reference2);
    });
});
