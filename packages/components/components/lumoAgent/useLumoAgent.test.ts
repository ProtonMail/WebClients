import { act, renderHook, waitFor } from '@testing-library/react';

import type { ToolDefinition } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createLoadGuideDefinition } from '@proton/llm/lib/lumoAgent/engine/loadGuide';
import type {
    ClientToolExecutor,
    GenerationResponseMessage,
    ToolName as ServerToolName,
} from '@proton/lumo-api-client';

import type { LumoAgentConfig } from './types';
import useLumoAgent from './useLumoAgent';

// The transport is driven, not reimplemented: each test sets a `script` that the mocked callAssistant
// runs with the real MR4 executor + the hook's chunkCallback. useApi is stubbed (no network).
type Script = (ctx: {
    executor: ClientToolExecutor;
    chunk: (message: GenerationResponseMessage) => void;
}) => Promise<void>;
let script: Script = async () => {};

jest.mock('@proton/components/hooks/useApi', () => ({
    __esModule: true,
    default: () => jest.fn(),
}));

jest.mock('@proton/lumo-api-client', () => ({
    __esModule: true,
    LumoApiClient: class {
        async callAssistant(_api: unknown, _turns: unknown, options: any) {
            await script({ executor: options.clientToolExecutor, chunk: options.chunkCallback });
        }
    },
}));

const message = (content: string): GenerationResponseMessage =>
    ({ type: 'token_data', target: 'message', count: 0, content }) as GenerationResponseMessage;

const handlerCalls: { name: string; params: Record<string, any> }[] = [];

const definitions: ToolDefinition[] = [
    {
        name: 'view_items',
        kind: 'read',
        toolDescription: 'view items',
        paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
        serializeForLumo: () => '2 items',
        summarizeChip: () => ({ label: 'Read 2 items' }),
    },
    {
        name: 'search_items',
        kind: 'read',
        toolDescription: 'search items',
        paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
        needsGuide: true,
        guide: 'THE SEARCH GUIDE',
        serializeForLumo: () => '1 item',
        summarizeChip: () => ({ label: 'Searched' }),
    },
    {
        name: 'move_items',
        kind: 'mutation',
        toolDescription: 'move items',
        paramsSchema: {
            type: 'object',
            additionalProperties: false,
            required: ['target'],
            properties: { target: { type: 'string' } },
        },
        serializeForLumo: () => '',
        summarizeChip: () => ({ label: 'Move' }),
    },
];

const config: LumoAgentConfig = {
    definitions: [...definitions, createLoadGuideDefinition(definitions)!],
    handlers: {
        view_items: async () => ({}),
        search_items: async () => ({}),
        move_items: async (params) => {
            handlerCalls.push({ name: 'move_items', params });
            return {};
        },
    },
};

beforeEach(() => {
    handlerCalls.length = 0;
    script = async () => {};
});

describe('useLumoAgent', () => {
    it('streams a prose reply into a single reply item and toggles busy', async () => {
        script = async ({ chunk }) => {
            chunk(message('Hello'));
            chunk(message(' world'));
        };

        const { result } = renderHook(() => useLumoAgent(config));
        await act(async () => {
            await result.current.send('hi');
        });

        const kinds = result.current.items.map((item) => item.kind);
        expect(kinds).toEqual(['user', 'reply']);
        const reply = result.current.items.find((item) => item.kind === 'reply');
        expect(reply).toMatchObject({ text: 'Hello world' });
        expect(result.current.isBusy).toBe(false);
        expect(result.current.hasConversation).toBe(true);
    });

    it('renders a read tool run as a chip (via the executor) between reply bubbles', async () => {
        script = async ({ executor, chunk }) => {
            chunk(message('Let me look.'));
            await executor.execute([{ id: '1', name: 'view_items', arguments: '{}' }]);
            chunk(message('Here they are.'));
        };

        const { result } = renderHook(() => useLumoAgent(config));
        await act(async () => {
            await result.current.send('show me');
        });

        expect(result.current.items.map((item) => item.kind)).toEqual(['user', 'reply', 'chip', 'reply']);
        expect(result.current.items.find((item) => item.kind === 'chip')).toMatchObject({
            tool: 'view_items',
            label: 'Read 2 items',
            payload: '2 items',
        });
    });

    it('hides a guide load, but still starts a fresh reply bubble after it', async () => {
        script = async ({ executor, chunk }) => {
            chunk(message('First thought.'));
            await executor.execute([{ id: '1', name: 'load_guide', arguments: '{"guide":"search_items"}' }]);
            chunk(message('Second thought.'));
        };

        const { result } = renderHook(() => useLumoAgent(config));
        await act(async () => {
            await result.current.send('find something');
        });

        expect(result.current.items.map((item) => item.kind)).toEqual(['user', 'reply', 'reply']);
        expect(result.current.items.filter((item) => item.kind === 'reply').map((item) => item.text)).toEqual([
            'First thought.',
            'Second thought.',
        ]);
    });

    it('ignores a tool call for a tool the product did not enable server-side', async () => {
        script = async ({ chunk }) => {
            chunk({ type: 'server_tool_call', call_id: 'c1', name: 'view_items' } as GenerationResponseMessage);
        };

        const { result } = renderHook(() => useLumoAgent(config));
        await act(async () => {
            await result.current.send('show me');
        });

        expect(result.current.items.some((item) => item.kind === 'servertool')).toBe(false);
    });

    it('renders a declared server tool as a server-tool item', async () => {
        script = async ({ chunk }) => {
            chunk({ type: 'server_tool_call', call_id: 'c1', name: 'web_search' } as GenerationResponseMessage);
        };

        const { result } = renderHook(() => useLumoAgent({ ...config, serverTools: ['web_search' as ServerToolName] }));
        await act(async () => {
            await result.current.send('what is the weather');
        });

        expect(result.current.items.find((item) => item.kind === 'servertool')).toMatchObject({ tool: 'web_search' });
    });

    it('surfaces a mutation as a pending confirm, then applies it with the edited params on confirm', async () => {
        script = async ({ executor, chunk }) => {
            await executor.execute([{ id: '1', name: 'move_items', arguments: JSON.stringify({ target: 'Inbox' }) }]);
            chunk(message('Done.'));
        };

        const { result } = renderHook(() => useLumoAgent(config));

        let sendPromise: Promise<void>;
        act(() => {
            sendPromise = result.current.send('move them');
        });

        await waitFor(() =>
            expect(result.current.items.some((item) => item.kind === 'confirm' && item.status === 'pending')).toBe(true)
        );
        expect(result.current.isBusy).toBe(true);

        await act(async () => {
            result.current.confirm({ target: 'Archive' });
            await sendPromise;
        });

        expect(handlerCalls).toEqual([{ name: 'move_items', params: { target: 'Archive' } }]);
        expect(result.current.items.find((item) => item.kind === 'confirm')).toMatchObject({ status: 'applied' });
        // A mutation is shown by its confirm tile, never also as a chip.
        expect(result.current.items.some((item) => item.kind === 'chip')).toBe(false);
        expect(result.current.isBusy).toBe(false);
    });

    it('cancels a mutation without running the handler', async () => {
        script = async ({ executor }) => {
            await executor.execute([{ id: '1', name: 'move_items', arguments: JSON.stringify({ target: 'Inbox' }) }]);
        };

        const { result } = renderHook(() => useLumoAgent(config));

        let sendPromise: Promise<void>;
        act(() => {
            sendPromise = result.current.send('move them');
        });
        await waitFor(() =>
            expect(result.current.items.some((item) => item.kind === 'confirm' && item.status === 'pending')).toBe(true)
        );

        await act(async () => {
            result.current.cancel();
            await sendPromise;
        });

        expect(handlerCalls).toEqual([]);
        expect(result.current.items.find((item) => item.kind === 'confirm')).toMatchObject({ status: 'cancelled' });
    });

    it('clears the conversation', async () => {
        script = async ({ chunk }) => chunk(message('hi there'));
        const { result } = renderHook(() => useLumoAgent(config));
        await act(async () => {
            await result.current.send('hi');
        });
        expect(result.current.hasConversation).toBe(true);

        act(() => result.current.clear());
        expect(result.current.items).toEqual([]);
        expect(result.current.hasConversation).toBe(false);
    });
});
