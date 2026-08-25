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

jest.mock('@proton/app-context/useApi', () => ({
    __esModule: true,
    useApi: () => jest.fn(),
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

// What the transport hands back after a tool round: it drops the blank assistant turn that padded the
// previous round, appends the round's turns, then pads again for the generation that follows.
const afterToolRound = (turns: Turn[], ...appended: unknown[]): Turn[] => {
    const last = turns[turns.length - 1];
    const stripped = last?.role === 'assistant' && !last.content ? turns.slice(0, -1) : turns;
    return [...stripped, ...appended, { role: 'assistant', content: '' }] as Turn[];
};

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

        it('takes nothing from the exchange that replaced it when it unwinds late', async () => {
            let releaseAbandoned = () => {};
            const abandonedMayFinish = new Promise<void>((resolve) => {
                releaseAbandoned = resolve;
            });
            let sendPromise: Promise<void>;
            script = async ({ executor, chunk }) => {
                chunk(message('Moving them.'));
                await executor.execute([{ id: '1', name: 'move_items', arguments: '{"target":"Archive"}' }]);
                await abandonedMayFinish;
            };

            const { result } = renderHook(() => useLumoAgent(config));
            act(() => {
                sendPromise = result.current.send('archive them');
            });
            await pinConfirm(result);

            script = async ({ chunk }) => {
                chunk(message('Still looking.'));
                return { stoppedOnBudget: true, turns: sentTurns[1] };
            };
            await act(async () => {
                await result.current.send('actually where are my tickets');
            });

            // The abandoned chain returns normally, not by throwing: the transport reports an aborted
            // budget stop as a plain finish.
            await act(async () => {
                releaseAbandoned();
                await sendPromise;
            });
            expect(result.current.isAtToolLimit).toBe(true);

            script = async ({ chunk }) => chunk(message('In Archive.'));
            await act(async () => {
                await result.current.resume();
            });
            script = async ({ chunk }) => chunk(message('Any time.'));
            await act(async () => {
                await result.current.send('thanks');
            });

            expect(sentTurns[3]).toEqual([
                expect.objectContaining({ role: 'system' }),
                { role: 'user', content: 'actually where are my tickets' },
                { role: 'assistant', content: 'Still looking.\n\nIn Archive.' },
                { role: 'user', content: 'thanks' },
            ]);
        });
    });

    describe('a chain that stops on its tool budget', () => {
        const chain: Turn[] = afterToolRound([{ role: 'user' as any, content: 'the whole chain so far' }]);
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

        it('banks its narration once, and not after the tool turns, when it stopped on a tool round', async () => {
            script = async ({ chunk }) => {
                chunk(message('Checking the Inbox.'));
                return {
                    stoppedOnBudget: true,
                    turns: afterToolRound(
                        sentTurns[0],
                        { role: 'assistant', content: 'Checking the Inbox.' },
                        { role: 'tool_call', content: '{"id":"1","name":"view_items","arguments":{}}' },
                        { role: 'tool_result', content: '2 items' }
                    ),
                };
            };

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('find my festival tickets');
            });

            script = async ({ chunk }) => chunk(message('Sure.'));
            await act(async () => {
                await result.current.send('never mind, what time is it');
            });

            expect(sentTurns[1]).toEqual([
                expect.objectContaining({ role: 'system' }),
                { role: 'user', content: 'find my festival tickets' },
                { role: 'assistant', content: 'Checking the Inbox.' },
                { role: 'user', content: 'never mind, what time is it' },
            ]);
        });
    });

    describe('the history a second message replays', () => {
        const chainWith = (...turns: unknown[]): Turn[] => afterToolRound(sentTurns[0], ...turns);
        const secondMessage = async (result: { current: ReturnType<typeof useLumoAgent> }, text: string) => {
            script = async ({ chunk }) => chunk(message('Sure.'));
            await act(async () => {
                await result.current.send(text);
            });
        };

        it('keeps a mutation call and its result, so the model can see that it changes things by calling', async () => {
            const call = '{"id":"1","name":"move_items","arguments":{"target":"Archive"}}';
            script = async ({ chunk }) => {
                chunk(message('I will move them.'));
                chunk(message(' Done.'));
                return {
                    turns: chainWith(
                        { role: 'assistant', content: 'I will move them.' },
                        { role: 'tool_call', content: call },
                        { role: 'tool_result', content: 'Applied move_items successfully. 2 moved to Archive.' }
                    ),
                };
            };

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('move them to Archive');
            });
            await secondMessage(result, 'undo that');

            expect(sentTurns[1]).toEqual([
                expect.objectContaining({ role: 'system' }),
                { role: 'user', content: 'move them to Archive' },
                { role: 'assistant', content: 'I will move them.' },
                { role: 'tool_call', content: call },
                { role: 'tool_result', content: 'Applied move_items successfully. 2 moved to Archive.' },
                { role: 'assistant', content: 'Done.' },
                { role: 'user', content: 'undo that' },
            ]);
        });

        it("keeps a read's call but not its payload, which has had a whole turn to go stale", async () => {
            const call = '{"id":"1","name":"view_items","arguments":{}}';
            script = async ({ chunk }) => {
                chunk(message('Let me look.'));
                chunk(message(' Two items.'));
                return {
                    turns: chainWith(
                        { role: 'assistant', content: 'Let me look.' },
                        { role: 'tool_call', content: call },
                        { role: 'tool_result', content: '2 items: Gas bill, Festival ticket' }
                    ),
                };
            };

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('show me');
            });
            await secondMessage(result, 'and the second one?');

            expect(sentTurns[1]).toContainEqual({ role: 'tool_call', content: call });
            const results = sentTurns[1].filter((turn) => turn.role === 'tool_result');
            expect(results).toHaveLength(1);
            expect(results[0].content).not.toContain('Gas bill');
        });

        it('elides the result of a call naming a tool this session does not define', async () => {
            const call = '{"id":"1","name":"archive_everything","arguments":{}}';
            script = async ({ chunk }) => {
                chunk(message('Done.'));
                return {
                    turns: chainWith(
                        { role: 'tool_call', content: call },
                        { role: 'tool_result', content: 'archived 400 emails' }
                    ),
                };
            };

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('tidy up');
            });
            await secondMessage(result, 'what did you do?');

            expect(sentTurns[1]).toContainEqual({ role: 'tool_call', content: call });
            const results = sentTurns[1].filter((turn) => turn.role === 'tool_result');
            expect(results).toHaveLength(1);
            expect(results[0].content).not.toContain('archived 400 emails');
        });

        it('banks a resumed exchange once, carrying the tool turns of both of its chains', async () => {
            const firstCall = '{"id":"1","name":"view_items","arguments":{}}';
            const secondCall = '{"id":"2","name":"move_items","arguments":{"target":"Archive"}}';
            script = async ({ chunk }) => {
                chunk(message('Checking the Inbox.'));
                return {
                    stoppedOnBudget: true,
                    turns: chainWith(
                        { role: 'assistant', content: 'Checking the Inbox.' },
                        { role: 'tool_call', content: firstCall },
                        { role: 'tool_result', content: '2 items' }
                    ),
                };
            };

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('archive my old tickets');
            });

            script = async ({ chunk }) => {
                chunk(message('Archived them.'));
                return {
                    turns: afterToolRound(
                        sentTurns[1],
                        { role: 'tool_call', content: secondCall },
                        { role: 'tool_result', content: 'Applied move_items successfully.' }
                    ),
                };
            };
            await act(async () => {
                await result.current.resume();
            });
            await secondMessage(result, 'thanks');

            expect(sentTurns[2]).toEqual([
                expect.objectContaining({ role: 'system' }),
                { role: 'user', content: 'archive my old tickets' },
                { role: 'assistant', content: 'Checking the Inbox.' },
                { role: 'tool_call', content: firstCall },
                expect.objectContaining({ role: 'tool_result' }),
                { role: 'tool_call', content: secondCall },
                { role: 'tool_result', content: 'Applied move_items successfully.' },
                { role: 'assistant', content: 'Archived them.' },
                { role: 'user', content: 'thanks' },
            ]);
        });

        it('banks a prose-only exchange as the question and the answer, and nothing else', async () => {
            script = async ({ chunk }) => chunk(message('It is Tuesday.'));

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('what day is it');
            });
            await secondMessage(result, 'and the date?');

            expect(sentTurns[1]).toEqual([
                expect.objectContaining({ role: 'system' }),
                { role: 'user', content: 'what day is it' },
                { role: 'assistant', content: 'It is Tuesday.' },
                { role: 'user', content: 'and the date?' },
            ]);
        });

        it('banks neither side of an exchange that ran a tool but never answered', async () => {
            script = async ({ executor }) => {
                await executor.execute([{ id: '1', name: 'view_items', arguments: '{}' }]);
                return {
                    turns: chainWith(
                        { role: 'tool_call', content: '{"id":"1","name":"view_items","arguments":{}}' },
                        { role: 'tool_result', content: '2 items' }
                    ),
                };
            };

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('show me');
            });
            await secondMessage(result, 'never mind');

            expect(sentTurns[1]).toEqual([
                expect.objectContaining({ role: 'system' }),
                { role: 'user', content: 'never mind' },
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

    it('builds a debug transcript of the system prompt followed by the banked turns in order', async () => {
        script = async ({ chunk }) => chunk(message('First answer.'));
        const { result } = renderHook(() => useLumoAgent({ ...config, productRules: 'ONLY MOVE MAIL THE USER NAMED' }));
        await act(async () => {
            await result.current.send('first question');
        });
        script = async ({ chunk }) => chunk(message('Second answer.'));
        await act(async () => {
            await result.current.send('second question');
        });

        const transcript = result.current.getDebugTranscript();
        expect(transcript).toMatch(
            /^===== SYSTEM =====\n[\s\S]+\n\n===== USER =====\nfirst question\n\n===== ASSISTANT =====\nFirst answer\.\n\n===== USER =====\nsecond question\n\n===== ASSISTANT =====\nSecond answer\.$/
        );
        expect(transcript).toContain('ONLY MOVE MAIL THE USER NAMED');
    });

    it("interleaves each round's narration with its tool call, arguments and result", async () => {
        script = async ({ executor, chunk }) => {
            chunk(message('Let me look.'));
            await executor.execute([{ id: '1', name: 'view_items', arguments: '{}' }]);
            chunk(message('Two items.'));
            // The transport banks the round's narration and its tool exchange in the chain it returns,
            // and breaks before banking the closing prose.
            return {
                turns: afterToolRound(
                    sentTurns[0],
                    { role: 'assistant', content: 'Let me look.' },
                    { role: 'tool_call', content: '{"id":"1","name":"view_items","arguments":{}}' },
                    { role: 'tool_result', content: '2 items' }
                ),
            };
        };

        const { result } = renderHook(() => useLumoAgent(config));
        await act(async () => {
            await result.current.send('show me');
        });

        expect(result.current.getDebugTranscript()).toMatch(
            /===== USER =====\nshow me\n\n===== ASSISTANT =====\nLet me look\.\n\n===== TOOL_CALL =====\n\{"id":"1","name":"view_items","arguments":\{\}\}\n\n===== TOOL_RESULT =====\n2 items\n\n===== ASSISTANT =====\nTwo items\.$/
        );
    });

    it('does not repeat the narration when the last round called a tool instead of speaking', async () => {
        script = async ({ executor, chunk }) => {
            chunk(message('Let me look.'));
            await executor.execute([{ id: '1', name: 'view_items', arguments: '{}' }]);
            return {
                turns: afterToolRound(
                    sentTurns[0],
                    { role: 'assistant', content: 'Let me look.' },
                    { role: 'tool_call', content: '{"id":"1","name":"view_items","arguments":{}}' },
                    { role: 'tool_result', content: '2 items' }
                ),
            };
        };

        const { result } = renderHook(() => useLumoAgent(config));
        await act(async () => {
            await result.current.send('show me');
        });

        expect(result.current.getDebugTranscript()).toMatch(/===== TOOL_RESULT =====\n2 items$/);
    });

    it('does not repeat the prose the user already read when a resumed chain answers plainly', async () => {
        script = async ({ chunk }) => {
            chunk(message('I checked the Inbox.'));
            return { stoppedOnBudget: true, turns: sentTurns[0] };
        };

        const { result } = renderHook(() => useLumoAgent(config));
        await act(async () => {
            await result.current.send('find my tickets');
        });

        script = async ({ chunk }) => chunk(message('They were in Archive.'));
        await act(async () => {
            await result.current.resume();
        });

        const transcript = result.current.getDebugTranscript();
        expect(transcript.match(/I checked the Inbox\./g)).toHaveLength(1);
        expect(transcript).toContain('They were in Archive.');
    });

    it("does not repeat a resumed round's narration when that round ended on a tool call", async () => {
        script = async ({ chunk }) => {
            chunk(message('I checked the Inbox.'));
            return { stoppedOnBudget: true, turns: sentTurns[0] };
        };

        const { result } = renderHook(() => useLumoAgent(config));
        await act(async () => {
            await result.current.send('find my tickets');
        });

        script = async ({ executor, chunk }) => {
            chunk(message('Now Trash.'));
            await executor.execute([{ id: '1', name: 'view_items', arguments: '{}' }]);
            return {
                turns: afterToolRound(
                    sentTurns[1],
                    { role: 'assistant', content: 'Now Trash.' },
                    { role: 'tool_call', content: '{"id":"1","name":"view_items","arguments":{}}' },
                    { role: 'tool_result', content: '2 items' }
                ),
            };
        };
        await act(async () => {
            await result.current.resume();
        });

        expect(result.current.getDebugTranscript().match(/Now Trash\./g)).toHaveLength(1);
    });
});
