import { act } from '@testing-library/react-hooks';
import { wait } from 'proton-shared/lib/helpers/promise';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { useConversation } from './useConversation';
import { renderHook, clearAll, addApiMock, conversationCache, cache, elementsCache } from '../../helpers/test/helper';
import { ELEMENTS_CACHE_KEY } from '../mailbox/useElementsCache';

describe('useConversation', () => {
    const ID = 'ID';
    const message = {} as Message;

    const setup = (argId?: string) => {
        cache.set(ELEMENTS_CACHE_KEY, elementsCache);
        return renderHook((rerenderId?: string) => useConversation(rerenderId || argId || ID));
    };

    beforeEach(() => {
        jest.clearAllMocks();
        clearAll();
    });

    it('should return cache value', async () => {
        const reference = { Conversation: {}, Messages: [message], loadRetry: 0, errors: {} };
        conversationCache.set(ID, reference);
        const hook = setup();
        expect(hook.result.current.conversation).toEqual(reference);
    });

    it('should update value if cache is updated', async () => {
        const reference1 = { Conversation: {}, Messages: [message], loadRetry: 0, errors: {} };
        conversationCache.set(ID, reference1);
        const hook = setup();
        expect(hook.result.current.conversation).toEqual(reference1);

        const reference2 = { Conversation: {}, Messages: [message], loadRetry: 0, errors: {} };
        conversationCache.set(ID, reference2);
        expect(hook.result.current.conversation).toEqual(reference2);
    });

    it('should launch api request when needed', async () => {
        const response = { Conversation: {}, Messages: [message] };
        addApiMock('mail/v4/conversations/ID', () => response);
        const hook = setup();
        expect(hook.result.current.conversation).toEqual({
            Conversation: undefined,
            Messages: undefined,
            loadRetry: 0,
            errors: {},
        });
        await act(async () => wait(0));
        expect(hook.result.current.conversation).toEqual({
            ...response,
            loadRetry: 1,
            errors: {
                network: [],
                unknown: [],
            },
        });
    });

    it('should change conversation when id change', async () => {
        const ID2 = 'ID2';
        const reference1 = { Conversation: {}, Messages: [message], loadRetry: 0, errors: {} };
        const reference2 = { Conversation: {}, Messages: [message], loadRetry: 0, errors: {} };
        conversationCache.set(ID, reference1);
        conversationCache.set(ID2, reference2);
        const hook = setup();
        expect(hook.result.current.conversation).toEqual(reference1);
        hook.rerender(ID2);
        expect(hook.result.current.conversation).toEqual(reference2);
    });
});
