import { act, renderHook, waitFor } from '@testing-library/react';

import type { ToolDefinition } from '@proton/llm/lib/lumoAgent/contracts/types';
import { createLoadGuideDefinition } from '@proton/llm/lib/lumoAgent/engine/loadGuide';
import type {
    ClientToolExecutor,
    GenerationResponseMessage,
    ToolName as ServerToolName,
    Turn,
} from '@proton/lumo-api-client';

import type { LumoAgentConfig } from './types';
import useLumoAgent from './useLumoAgent';

// The transport is driven, not reimplemented: each test sets a `script` that the mocked callAssistant
// runs with the real tool executor + the hook's chunkCallback, then optionally reports how the chain
// ended. useApi is stubbed (no network).
type Script = (ctx: {
    executor: ClientToolExecutor;
    chunk: (message: GenerationResponseMessage) => void;
}) => Promise<void | { stoppedOnBudget?: boolean; turns?: Turn[] }>;
let script: Script = async () => {};
const sentTurns: Turn[][] = [];

jest.mock('@proton/components/hooks/useApi', () => ({
    __esModule: true,
    default: () => jest.fn(),
}));

jest.mock('@proton/lumo-api-client', () => ({
    __esModule: true,
    LumoApiClient: class {
        async callAssistant(_api: unknown, turns: Turn[], options: any) {
            sentTurns.push(turns);
            const outcome =
                (await script({ executor: options.clientToolExecutor, chunk: options.chunkCallback })) || {};
            return {
                status: 'succeeded',
                stoppedOnBudget: outcome.stoppedOnBudget ?? false,
                turns: outcome.turns ?? turns,
            };
        }
    },
}));

const message = (content: string): GenerationResponseMessage =>
    ({ type: 'token_data', target: 'message', count: 0, content }) as GenerationResponseMessage;

const handlerCalls: { name: string; params: Record<string, any> }[] = [];
const readCalls: string[] = [];

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
            properties: { target: { type: 'string' }, ids: { type: 'array', items: { type: 'string' } } },
        },
        serializeForLumo: () => '',
        summarizeChip: () => ({ label: 'Move' }),
    },
];

const config: LumoAgentConfig = {
    definitions: [...definitions, createLoadGuideDefinition(definitions)!],
    handlers: {
        view_items: async () => {
            readCalls.push('view_items');
            return {};
        },
        search_items: async () => ({}),
        move_items: async (params) => {
            handlerCalls.push({ name: 'move_items', params });
            return {};
        },
    },
};

beforeEach(() => {
    handlerCalls.length = 0;
    readCalls.length = 0;
    sentTurns.length = 0;
    script = async () => {};
});

describe('useLumoAgent', () => {
    const pinConfirm = async (result: { current: ReturnType<typeof useLumoAgent> }) =>
        waitFor(() =>
            expect(result.current.items.some((item) => item.kind === 'confirm' && item.status === 'pending')).toBe(true)
        );

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

    it('hides the guide-load chip but keeps the prose written alongside it', async () => {
        script = async ({ executor, chunk }) => {
            chunk(message("I'll search for that."));
            await executor.execute([{ id: '1', name: 'load_guide', arguments: '{"guide":"search_items"}' }]);
            chunk(message('Here is what I found.'));
        };

        const { result } = renderHook(() => useLumoAgent(config));
        await act(async () => {
            await result.current.send('find something');
        });

        expect(result.current.items.map((item) => item.kind)).toEqual(['user', 'reply', 'reply']);
        expect(result.current.items.filter((item) => item.kind === 'reply')).toMatchObject([
            { text: "I'll search for that." },
            { text: 'Here is what I found.' },
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
            await executor.execute([
                { id: '1', name: 'move_items', arguments: JSON.stringify({ target: 'Inbox', ids: ['a', 'b'] }) },
            ]);
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
        // A tile still reporting the proposal describes a mutation that never happened, so a param the
        // body dropped must not survive on it either.
        const settled = result.current.items.find((item) => item.kind === 'confirm');
        expect(settled).toMatchObject({ status: 'applied', action: { type: 'move_items', target: 'Archive' } });
        expect(settled).not.toMatchObject({ action: { ids: expect.anything() } });
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
        expect(result.current.items.find((item) => item.kind === 'confirm')).toMatchObject({
            status: 'cancelled',
            action: { type: 'move_items', target: 'Inbox' },
        });
    });

    describe('stopping while a mutation is awaiting confirmation', () => {
        it('settles the pinned card as cancelled, so a later apply cannot run the mutation', async () => {
            script = async ({ executor }) => {
                await executor.execute([
                    { id: '1', name: 'move_items', arguments: JSON.stringify({ target: 'Inbox' }) },
                ]);
            };

            const { result } = renderHook(() => useLumoAgent(config));

            let sendPromise: Promise<void>;
            act(() => {
                sendPromise = result.current.send('move them');
            });
            await pinConfirm(result);

            await act(async () => {
                result.current.stop();
                await sendPromise;
            });

            expect(result.current.items.find((item) => item.kind === 'confirm')).toMatchObject({
                status: 'cancelled',
            });
            expect(result.current.isBusy).toBe(false);

            act(() => result.current.confirm({ target: 'Archive' }));
            expect(handlerCalls).toEqual([]);
        });

        it('does not pin a fresh card for the rest of the batch', async () => {
            script = async ({ executor }) => {
                await executor.execute([
                    { id: '1', name: 'move_items', arguments: JSON.stringify({ target: 'Inbox' }) },
                    { id: '2', name: 'move_items', arguments: JSON.stringify({ target: 'Trash' }) },
                ]);
            };

            const { result } = renderHook(() => useLumoAgent(config));

            let sendPromise: Promise<void>;
            act(() => {
                sendPromise = result.current.send('move them, then bin the rest');
            });
            await pinConfirm(result);

            await act(async () => {
                result.current.stop();
                await sendPromise;
            });

            expect(result.current.items.filter((item) => item.kind === 'confirm')).toHaveLength(1);
            expect(handlerCalls).toEqual([]);
        });

        it('does not run the read tail of the batch', async () => {
            script = async ({ executor }) => {
                await executor.execute([
                    { id: '1', name: 'move_items', arguments: JSON.stringify({ target: 'Inbox' }) },
                    { id: '2', name: 'view_items', arguments: '{}' },
                ]);
            };

            const { result } = renderHook(() => useLumoAgent(config));

            let sendPromise: Promise<void>;
            act(() => {
                sendPromise = result.current.send('move them, then show me what is left');
            });
            await pinConfirm(result);

            await act(async () => {
                result.current.stop();
                await sendPromise;
            });

            expect(readCalls).toEqual([]);
            expect(result.current.items.some((item) => item.kind === 'chip')).toBe(false);
        });
    });

    describe('typing instead of answering a pinned confirm', () => {
        it('rejects the card and sends the message', async () => {
            script = async ({ executor }) => {
                await executor.execute([
                    { id: '1', name: 'move_items', arguments: JSON.stringify({ target: 'Inbox' }) },
                ]);
            };

            const { result } = renderHook(() => useLumoAgent(config));

            let sendPromise: Promise<void>;
            act(() => {
                sendPromise = result.current.send('move them');
            });
            await pinConfirm(result);

            script = async ({ chunk }) => chunk(message('Sure, what would you like instead?'));
            await act(async () => {
                await result.current.send('actually just tell me who sent them');
                await sendPromise;
            });

            expect(result.current.items.find((item) => item.kind === 'confirm')).toMatchObject({
                status: 'cancelled',
            });
            expect(handlerCalls).toEqual([]);
            expect(result.current.items.map((item) => item.kind)).toEqual(['user', 'confirm', 'user', 'reply']);
            expect(sentTurns[1]).toEqual([
                expect.objectContaining({ role: 'system' }),
                { role: 'user', content: 'actually just tell me who sent them' },
            ]);
        });

        it('leaves the replacement chain running once the abandoned one unwinds', async () => {
            script = async ({ executor }) => {
                await executor.execute([
                    { id: '1', name: 'move_items', arguments: JSON.stringify({ target: 'Inbox' }) },
                ]);
            };

            const { result } = renderHook(() => useLumoAgent(config));

            let sendPromise: Promise<void>;
            act(() => {
                sendPromise = result.current.send('move them');
            });
            await pinConfirm(result);

            // Parks the replacement chain so the abandoned one is guaranteed to unwind while it is live.
            let releaseReplacement: () => void = () => {};
            script = async () => new Promise<void>((resolve) => (releaseReplacement = resolve));

            let replacementPromise: Promise<void>;
            act(() => {
                replacementPromise = result.current.send('actually just tell me who sent them');
            });
            await act(async () => {
                await sendPromise;
            });

            expect(result.current.isBusy).toBe(true);

            await act(async () => {
                releaseReplacement();
                await replacementPromise;
            });

            expect(result.current.isBusy).toBe(false);
        });

        it('does not pin a card from the abandoned chain onto the new turn', async () => {
            script = async ({ executor }) => {
                await executor.execute([
                    { id: '1', name: 'move_items', arguments: JSON.stringify({ target: 'Inbox' }) },
                    { id: '2', name: 'move_items', arguments: JSON.stringify({ target: 'Trash' }) },
                ]);
            };

            const { result } = renderHook(() => useLumoAgent(config));

            let sendPromise: Promise<void>;
            act(() => {
                sendPromise = result.current.send('move them, then bin the rest');
            });
            await pinConfirm(result);

            script = async ({ chunk }) => chunk(message('Sure, what would you like instead?'));
            await act(async () => {
                await result.current.send('actually just tell me who sent them');
                await sendPromise;
            });

            expect(result.current.items.map((item) => item.kind)).toEqual(['user', 'confirm', 'user', 'reply']);

            // Nothing is pending, so confirming cannot reach the abandoned chain's second mutation.
            act(() => result.current.confirm({ target: 'Spam' }));
            expect(handlerCalls).toEqual([]);
        });

        it('does not push a chip from the abandoned chain onto the new turn', async () => {
            script = async ({ executor }) => {
                await executor.execute([
                    { id: '1', name: 'move_items', arguments: JSON.stringify({ target: 'Inbox' }) },
                    { id: '2', name: 'view_items', arguments: '{}' },
                ]);
            };

            const { result } = renderHook(() => useLumoAgent(config));

            let sendPromise: Promise<void>;
            act(() => {
                sendPromise = result.current.send('move them, then show me what is left');
            });
            await pinConfirm(result);

            script = async ({ chunk }) => chunk(message('Sure, what would you like instead?'));
            await act(async () => {
                await result.current.send('actually just tell me who sent them');
                await sendPromise;
            });

            expect(readCalls).toEqual([]);
            expect(result.current.items.map((item) => item.kind)).toEqual(['user', 'confirm', 'user', 'reply']);
        });
    });

    describe('a chain that stops on its tool budget', () => {
        const chain: Turn[] = [{ role: 'user' as any, content: 'the whole chain so far' }];
        const stopOnBudget: Script = async ({ chunk }) => {
            chunk(message('I found one order, but I have not checked Trash yet.'));
            return { stoppedOnBudget: true, turns: chain };
        };

        it('asks the user whether to carry on rather than ending the turn on its own', async () => {
            script = stopOnBudget;

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('find my festival tickets');
            });

            expect(result.current.isAtToolLimit).toBe(true);
            expect(result.current.isBusy).toBe(false);
        });

        it('resumes from the accumulated chain instead of re-sending the message', async () => {
            script = stopOnBudget;

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('find my festival tickets');
            });

            script = async ({ chunk }) => chunk(message('Found them in Trash.'));
            await act(async () => {
                await result.current.resume();
            });

            expect(sentTurns[1]).toEqual(chain);
            expect(result.current.isAtToolLimit).toBe(false);
            expect(result.current.items.map((item) => item.kind)).toEqual(['user', 'reply', 'reply']);
        });

        it('banks both halves of the answer once the user has carried on', async () => {
            script = stopOnBudget;

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('find my festival tickets');
            });

            script = async ({ chunk }) => chunk(message('Found them in Trash.'));
            await act(async () => {
                await result.current.resume();
            });

            script = async ({ chunk }) => chunk(message('Any time.'));
            await act(async () => {
                await result.current.send('thanks');
            });

            expect(sentTurns[2]).toEqual([
                expect.objectContaining({ role: 'system' }),
                { role: 'user', content: 'find my festival tickets' },
                {
                    role: 'assistant',
                    content: 'I found one order, but I have not checked Trash yet.\n\nFound them in Trash.',
                },
                { role: 'user', content: 'thanks' },
            ]);
        });

        it('says it is unfinished when the budget runs out on a round that wrote no prose', async () => {
            script = async ({ executor }) => {
                await executor.execute([{ id: '1', name: 'view_items', arguments: '{}' }]);
                return { stoppedOnBudget: true, turns: chain };
            };

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('find my festival tickets');
            });

            expect(result.current.items.map((item) => item.kind)).toEqual(['user', 'chip', 'reply']);

            script = async ({ chunk }) => chunk(message('Sure.'));
            await act(async () => {
                await result.current.send('never mind, what time is it');
            });

            // Never an empty assistant turn: the stand-in prose is what gets banked.
            expect(sentTurns[1]).toEqual([
                expect.objectContaining({ role: 'system' }),
                { role: 'user', content: 'find my festival tickets' },
                { role: 'assistant', content: 'I have not finished this one yet.' },
                { role: 'user', content: 'never mind, what time is it' },
            ]);
        });

        it('keeps the offer, and the partial answer, when the resumed chain fails', async () => {
            script = stopOnBudget;

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('find my festival tickets');
            });

            script = async () => {
                throw new Error('network');
            };
            await act(async () => {
                await result.current.resume();
            });

            expect(result.current.isAtToolLimit).toBe(true);

            script = async ({ chunk }) => chunk(message('Found them in Trash.'));
            await act(async () => {
                await result.current.resume();
            });

            expect(sentTurns[2]).toEqual(chain);
            expect(result.current.isAtToolLimit).toBe(false);
        });

        it('banks whatever it managed to say when the user declines and types instead', async () => {
            script = stopOnBudget;

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('find my festival tickets');
            });

            script = async ({ chunk }) => chunk(message('Sure.'));
            await act(async () => {
                await result.current.send('never mind, what time is it');
            });

            expect(result.current.isAtToolLimit).toBe(false);
            expect(sentTurns[1]).toEqual([
                expect.objectContaining({ role: 'system' }),
                { role: 'user', content: 'find my festival tickets' },
                { role: 'assistant', content: 'I found one order, but I have not checked Trash yet.' },
                { role: 'user', content: 'never mind, what time is it' },
            ]);
        });
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
