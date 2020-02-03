import { renderHook, act } from '@testing-library/react-hooks';
import { useConversation } from './useConversation';
import * as ConversationProviderMock from '../containers/ConversationProvider';
import * as ReactComponents from 'react-components';
import { wait } from 'proton-shared/lib/helpers/promise';

// Needed to make TS accepts the mock exports
const cacheMock: ConversationProviderMock.ConversationCache = (ConversationProviderMock as any).cacheMock;
const ConversationProvider = ConversationProviderMock.default;
const api: jest.Mock = (ReactComponents as any).api;

jest.mock('../containers/ConversationProvider');

describe('useConversation', () => {
    const ID = 'ID';

    const setup = (argId?: string) =>
        renderHook((rerenderId?: string) => useConversation(rerenderId || argId || ID), {
            wrapper: ConversationProvider
        });

    afterEach(() => {
        jest.clearAllMocks();
        cacheMock.reset();
    });

    it('should return cache value', () => {
        const reference = { Conversation: {} };
        cacheMock.set(ID, reference);
        const hook = setup();
        expect(hook.result.current[0]).toBe(reference);
    });

    it('should update value if cache is updated', async () => {
        const reference1 = { Conversation: {} };
        cacheMock.set(ID, reference1);
        const hook = setup();
        expect(hook.result.current[0]).toBe(reference1);

        const reference2 = { Conversation: {} };
        await act(async () => cacheMock.set(ID, reference2));
        expect(hook.result.current[0]).toBe(reference2);
    });

    it('should lauch api request when needed', async () => {
        const response = { Conversation: {} };
        api.mockResolvedValue(response);
        const hook = setup();
        expect(hook.result.current[0]).toBe(undefined);
        await act(async () => await wait(0));
        expect(hook.result.current[0]).toBe(response);
    });

    it('should change conversation when id change', async () => {
        const ID2 = 'ID2';
        const reference1 = { Conversation: {} };
        const reference2 = { Conversation: {} };
        cacheMock.set(ID, reference1);
        cacheMock.set(ID2, reference2);
        const hook = setup();
        expect(hook.result.current[0]).toBe(reference1);
        hook.rerender(ID2);
        expect(hook.result.current[0]).toBe(reference2);
    });
});
