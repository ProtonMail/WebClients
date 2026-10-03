import { act, renderHook, waitFor } from '@testing-library/react';

import type {
    ClientToolExecutor,
    GenerationResponseMessage,
    ToolName as ServerToolName,
    Turn,
} from '@proton/lumo-api-client';

import type { ToolDefinition } from '../contracts/types';
import { createLoadGuideDefinition } from '../engine/loadGuide';
import type { LumoAgentConfig } from './types';
import { ConfirmStatus, LumoChainEnd, LumoConfirmAnswer } from './types';
import useLumoAgent from './useLumoAgent';

// The transport is driven, not reimplemented: each test sets a `script` that the mocked callAssistant
// runs with the real tool executor + the hook's chunkCallback, then optionally reports how the chain
// ended. useApi is stubbed (no network).
type Script = (ctx: {
    executor: ClientToolExecutor;
    chunk: (message: GenerationResponseMessage) => void;
}) => Promise<void | { turns?: Turn[] }>;
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

const telemetry = {
    promptSent: jest.fn(),
    chainEnded: jest.fn(),
    confirmAnswered: jest.fn(),
};

const config: LumoAgentConfig = {
    telemetry,
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
    jest.clearAllMocks();
});

type AgentResult = { current: ReturnType<typeof useLumoAgent> };

describe('useLumoAgent', () => {
    const pinConfirm = async (result: AgentResult) =>
        waitFor(() =>
            expect(
                result.current.items.some((item) => item.kind === 'confirm' && item.status === ConfirmStatus.PENDING)
            ).toBe(true)
        );

    /**
     * Send the one message every mutation test sends, and wait for its card to pin. The still-running
     * chain comes back wrapped: returned bare, `await` would chain it and block on the card being answered.
     */
    const sendAndPinConfirm = async (result: AgentResult) => {
        let chain!: Promise<void>;
        act(() => {
            chain = result.current.send('move them');
        });
        await pinConfirm(result);
        return { chain };
    };

    const confirmTile = (result: AgentResult) => result.current.items.find((item) => item.kind === 'confirm');

    const runOneMutation: Script = async ({ executor }) => {
        await executor.execute([{ id: '1', name: 'move_items', arguments: JSON.stringify({ target: 'Inbox' }) }]);
    };

    const withMoveHandler = (move: LumoAgentConfig['handlers']['move_items']): LumoAgentConfig => ({
        ...config,
        handlers: { ...config.handlers, move_items: move },
    });

    /** A move that parks inside the handler until released, so a test can read the tile mid-flight. */
    const blockingMove = () => {
        let resolveParked = () => {};
        const parked = new Promise<void>((resolve) => {
            resolveParked = resolve;
        });
        return {
            config: withMoveHandler(async () => {
                await parked;
                return {};
            }),
            release: () => resolveParked(),
        };
    };

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

    it('puts an image a tool shows on the user turn, named by a marker, once per image', async () => {
        const withImage: LumoAgentConfig = {
            ...config,
            handlers: {
                ...config.handlers,
                view_items: async (_params, { showImage }) => {
                    showImage?.({ imageId: 'node-1', data: 'AAAA', name: 'sunset.jpg' });
                    showImage?.({ imageId: 'node-1', data: 'AAAA', name: 'sunset.jpg' });
                    return {};
                },
            },
        };
        script = async ({ executor }) => {
            await executor.execute([{ id: '1', name: 'view_items', arguments: '{}' }]);
        };

        const { result } = renderHook(() => useLumoAgent(withImage));
        await act(async () => {
            await result.current.send('what is this');
        });

        const userTurn = sentTurns[0].findLast((turn) => turn.role === 'user');
        expect(userTurn?.images).toEqual([{ encrypted: false, image_id: 'node-1', data: 'AAAA' }]);
        expect(userTurn?.content).toBe('what is this\n<lumo-image id="node-1" source="user" name="sunset.jpg" />');
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
        const { chain } = await sendAndPinConfirm(result);

        expect(result.current.isBusy).toBe(true);

        await act(async () => {
            result.current.confirm({ target: 'Archive' });
            await chain;
        });

        expect(handlerCalls).toEqual([{ name: 'move_items', params: { target: 'Archive' } }]);
        // A tile still reporting the proposal describes a mutation that never happened, so a param the
        // body dropped must not survive on it either.
        const settled = result.current.items.find((item) => item.kind === 'confirm');
        expect(settled).toMatchObject({
            status: ConfirmStatus.APPLIED,
            action: { type: 'move_items', target: 'Archive' },
        });
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
        const { chain } = await sendAndPinConfirm(result);

        await act(async () => {
            result.current.cancel();
            await chain;
        });

        expect(handlerCalls).toEqual([]);
        expect(confirmTile(result)).toMatchObject({
            status: ConfirmStatus.CANCELLED,
            action: { type: 'move_items', target: 'Inbox' },
        });
    });

    it('holds the tile at applying until the handler answers, so the click alone never reads as done', async () => {
        script = runOneMutation;
        const move = blockingMove();

        const { result } = renderHook(() => useLumoAgent(move.config));
        const { chain } = await sendAndPinConfirm(result);

        await act(async () => {
            result.current.confirm({ target: 'Archive' });
        });
        expect(confirmTile(result)).toMatchObject({ status: ConfirmStatus.APPLYING });

        await act(async () => {
            move.release();
            await chain;
        });
        expect(confirmTile(result)).toMatchObject({ status: ConfirmStatus.APPLIED });
    });

    it('settles a refused change as failed, so a success tile never sits above an apology', async () => {
        script = runOneMutation;

        const { result } = renderHook(() =>
            useLumoAgent(
                withMoveHandler(async () => {
                    throw new Error('the mailbox refused that');
                })
            )
        );
        const { chain } = await sendAndPinConfirm(result);

        await act(async () => {
            result.current.confirm({ target: 'Archive' });
            await chain;
        });

        expect(confirmTile(result)).toMatchObject({ status: ConfirmStatus.FAILED });
    });

    // `stop()` only settles a card the user has yet to answer. An approved one is already inside the
    // handler, and that call is not abortable.
    it('lets a change the user already approved finish and report, even once the chain is stopped', async () => {
        script = runOneMutation;
        const move = blockingMove();

        const { result } = renderHook(() => useLumoAgent(move.config));
        const { chain } = await sendAndPinConfirm(result);

        await act(async () => {
            result.current.confirm({ target: 'Archive' });
        });
        act(() => result.current.stop());

        await act(async () => {
            move.release();
            await chain;
        });
        expect(confirmTile(result)).toMatchObject({ status: ConfirmStatus.APPLIED });
    });

    it('releases a parked card on unmount, so the chain is not left awaiting an answer that cannot come', async () => {
        script = runOneMutation;

        const { result, unmount } = renderHook(() => useLumoAgent(config));
        const { chain } = await sendAndPinConfirm(result);

        unmount();

        await expect(chain).resolves.toBeUndefined();
        expect(handlerCalls).toEqual([]);
    });

    it('aborts the chain on unmount, so the released card cannot buy it another round', async () => {
        script = async ({ executor }) => {
            await executor.execute([{ id: '1', name: 'move_items', arguments: JSON.stringify({ target: 'Inbox' }) }]);
            await executor.execute([{ id: '2', name: 'move_items', arguments: JSON.stringify({ target: 'Spam' }) }]);
        };

        const { result, unmount } = renderHook(() => useLumoAgent(config));
        const { chain } = await sendAndPinConfirm(result);

        unmount();

        await expect(chain).resolves.toBeUndefined();
        expect(handlerCalls).toEqual([]);
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

            expect(confirmTile(result)).toMatchObject({ status: ConfirmStatus.CANCELLED });
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

            expect(confirmTile(result)).toMatchObject({ status: ConfirmStatus.CANCELLED });
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

            script = async ({ chunk }) => chunk(message('In Archive.'));
            await act(async () => {
                await result.current.send('actually where are my tickets');
            });

            // The abandoned chain returns normally, not by throwing: the transport reports an aborted
            // round as a plain finish.
            await act(async () => {
                releaseAbandoned();
                await sendPromise;
            });

            script = async ({ chunk }) => chunk(message('Any time.'));
            await act(async () => {
                await result.current.send('thanks');
            });

            expect(sentTurns[2]).toEqual([
                expect.objectContaining({ role: 'system' }),
                { role: 'user', content: 'actually where are my tickets' },
                { role: 'assistant', content: 'In Archive.' },
                { role: 'user', content: 'thanks' },
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

        it("keeps a read's payload, so the next message can answer from it without reading again", async () => {
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

            expect(sentTurns[1]).toEqual([
                expect.objectContaining({ role: 'system' }),
                { role: 'user', content: 'show me' },
                { role: 'assistant', content: 'Let me look.' },
                { role: 'tool_call', content: call },
                { role: 'tool_result', content: '2 items: Gas bill, Festival ticket' },
                { role: 'assistant', content: 'Two items.' },
                { role: 'user', content: 'and the second one?' },
            ]);
        });

        it("elides a guide load's body, which the system prompt already carries", async () => {
            const call = '{"id":"1","name":"load_guide","arguments":{"guide":"search_items"}}';
            script = async ({ chunk }) => {
                chunk(message('Found one.'));
                return {
                    turns: chainWith(
                        { role: 'tool_call', content: call },
                        { role: 'tool_result', content: 'THE SEARCH GUIDE' }
                    ),
                };
            };

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('find it');
            });
            await secondMessage(result, 'and another?');

            expect(sentTurns[1]).toContainEqual({ role: 'tool_call', content: call });
            const results = sentTurns[1].filter((turn) => turn.role === 'tool_result');
            expect(results).toHaveLength(1);
            expect(results[0].content).not.toContain('THE SEARCH GUIDE');
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

        it('banks the tool work of an exchange the model never spoke in', async () => {
            const call = '{"id":"1","name":"view_items","arguments":{}}';
            script = async ({ executor }) => {
                await executor.execute([{ id: '1', name: 'view_items', arguments: '{}' }]);
                return {
                    turns: chainWith({ role: 'tool_call', content: call }, { role: 'tool_result', content: '2 items' }),
                };
            };

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('show me');
            });
            await secondMessage(result, 'and the second one?');

            expect(sentTurns[1]).toEqual([
                expect.objectContaining({ role: 'system' }),
                { role: 'user', content: 'show me' },
                { role: 'tool_call', content: call },
                { role: 'tool_result', content: expect.any(String) },
                { role: 'user', content: 'and the second one?' },
            ]);
        });

        it('banks a mutation that ran after the last narration, so the next message knows it applied', async () => {
            const call = '{"id":"1","name":"move_items","arguments":{"target":"Archive"}}';
            const applied = 'Applied move_items successfully. 2 moved to Archive.';
            script = async ({ chunk }) => {
                chunk(message('I will move them.'));
                return {
                    turns: chainWith(
                        { role: 'assistant', content: 'I will move them.' },
                        { role: 'tool_call', content: call },
                        { role: 'tool_result', content: applied }
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
                { role: 'tool_result', content: applied },
                { role: 'user', content: 'undo that' },
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
        const { result } = renderHook(() =>
            useLumoAgent({ ...config, productRules: () => 'ONLY MOVE MAIL THE USER NAMED' })
        );
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

    describe('the lifecycle it reports to its host', () => {
        const abortError = () => Object.assign(new Error('stopped'), { name: 'AbortError' });

        const lastChainEnd = () => telemetry.chainEnded.mock.calls[telemetry.chainEnded.mock.calls.length - 1];

        it('reports a chain that answered as succeeded, with what it spent getting there', async () => {
            script = async ({ executor, chunk }) => {
                await executor.execute([{ id: '1', name: 'view_items', arguments: '{}' }]);
                chunk(message('Two in the Inbox.'));
            };

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('how many are in my inbox');
            });

            expect(lastChainEnd()).toEqual([LumoChainEnd.SUCCEEDED, { durationMs: expect.any(Number), toolCalls: 1 }]);
        });

        it('reports a chain that threw as failed', async () => {
            script = async () => {
                throw new Error('the transport gave up');
            };

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('find my tickets');
            });

            expect(lastChainEnd()[0]).toBe(LumoChainEnd.FAILED);
        });

        // The two arms of the same catch: a transport that gave up and a user who did are opposite
        // problems, and only `error.name` separates them.
        it('reports an aborted chain as stopped rather than failed', async () => {
            script = async () => {
                throw abortError();
            };

            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('find my tickets');
            });

            expect(lastChainEnd()[0]).toBe(LumoChainEnd.STOPPED);
        });

        // The stream reports these as chunks and then finishes cleanly, so nothing throws and the
        // chain would otherwise report the error bubble the user is reading as an answer.
        it.each(['error', 'rejected', 'harmful', 'timeout'])(
            'reports a chain the stream ended with %s as failed',
            async (type) => {
                script = async ({ chunk }) => {
                    chunk({ type } as GenerationResponseMessage);
                };

                const { result } = renderHook(() => useLumoAgent(config));
                await act(async () => {
                    await result.current.send('find my tickets');
                });

                expect(lastChainEnd()[0]).toBe(LumoChainEnd.FAILED);
            }
        );

        // Both abort the chain exactly as `stop()` does, and only the reason tells the alpha whether
        // anyone was still waiting on the answer.
        it.each([
            ['the user cleared the conversation', (result: AgentResult) => result.current.clear()],
            ['the panel unmounted under it', (_result: AgentResult, unmount: () => void) => unmount()],
        ])('reports a chain discarded because %s as discarded, not stopped', async (_name, discard) => {
            let releaseChain = () => {};
            const chainMayFinish = new Promise<void>((resolve) => {
                releaseChain = resolve;
            });
            script = async () => {
                await chainMayFinish;
                throw abortError();
            };

            const { result, unmount } = renderHook(() => useLumoAgent(config));
            let sendPromise!: Promise<void>;
            act(() => {
                sendPromise = result.current.send('find my tickets');
            });

            act(() => discard(result, unmount));
            await act(async () => {
                releaseChain();
                await sendPromise;
            });

            expect(lastChainEnd()[0]).toBe(LumoChainEnd.DISCARDED);
        });

        // The real transport swallows the abort and finishes cleanly, exactly as a replaced chain does.
        it.each([
            ['stopped', (result: AgentResult) => result.current.stop(), LumoChainEnd.STOPPED],
            ['cleared', (result: AgentResult) => result.current.clear(), LumoChainEnd.DISCARDED],
        ])('reports a chain %s while the transport finishes cleanly as %s', async (_name, abandon, end) => {
            let releaseChain = () => {};
            const chainMayFinish = new Promise<void>((resolve) => {
                releaseChain = resolve;
            });
            script = () => chainMayFinish;

            const { result } = renderHook(() => useLumoAgent(config));
            let sendPromise!: Promise<void>;
            act(() => {
                sendPromise = result.current.send('find my tickets');
            });

            act(() => abandon(result));
            await act(async () => {
                releaseChain();
                await sendPromise;
            });

            expect(lastChainEnd()[0]).toBe(end);
        });

        // Without this the chain that a new message replaced never reports at all, and an abandoned
        // chain is indistinguishable from one still running.
        it('reports a chain whose successor owns the turn as replaced', async () => {
            let releaseAbandoned = () => {};
            const abandonedMayFinish = new Promise<void>((resolve) => {
                releaseAbandoned = resolve;
            });
            let sendPromise: Promise<void>;
            script = async ({ executor }) => {
                await executor.execute([{ id: '1', name: 'move_items', arguments: '{"target":"Archive"}' }]);
                await abandonedMayFinish;
            };

            const { result } = renderHook(() => useLumoAgent(config));
            act(() => {
                sendPromise = result.current.send('archive them');
            });
            await pinConfirm(result);

            script = async ({ chunk }) => chunk(message('Looking.'));
            await act(async () => {
                await result.current.send('actually, where are my tickets');
            });

            await act(async () => {
                releaseAbandoned();
                await sendPromise;
            });

            expect(telemetry.chainEnded.mock.calls.map(([end]) => end)).toContain(LumoChainEnd.REPLACED);
        });

        it('names the tool on the card the user answered', async () => {
            script = runOneMutation;

            const { result } = renderHook(() => useLumoAgent(config));
            const { chain } = await sendAndPinConfirm(result);
            await act(async () => {
                result.current.confirm({ target: 'Inbox' });
                await chain;
            });

            expect(telemetry.confirmAnswered).toHaveBeenCalledWith('move_items', LumoConfirmAnswer.APPLIED);
        });

        it('reports a card the user refused as cancelled', async () => {
            script = runOneMutation;

            const { result } = renderHook(() => useLumoAgent(config));
            const { chain } = await sendAndPinConfirm(result);
            act(() => result.current.cancel());
            await act(async () => {
                await chain;
            });

            expect(telemetry.confirmAnswered).toHaveBeenCalledWith('move_items', LumoConfirmAnswer.CANCELLED);
        });

        /**
         * Only the card's own cancel button is a refusal. Everything else takes the card off someone who
         * never answered it, and counting those as refusals would read as a cancel rate they never chose.
         */
        it.each([
            ['stopped the chain', async (result: AgentResult) => act(() => result.current.stop())],
            ['cleared the conversation', async (result: AgentResult) => act(() => result.current.clear())],
            ['closed the panel', async (_result: AgentResult, unmount: () => void) => act(() => unmount())],
            [
                'typed a new message instead of answering',
                async (result: AgentResult) => {
                    script = async ({ chunk }) => chunk(message('Looking.'));
                    await act(async () => {
                        await result.current.send('actually, where are my tickets');
                    });
                },
            ],
        ])('reports a card abandoned because the user %s as abandoned, not cancelled', async (_name, abandon) => {
            script = runOneMutation;

            const { result, unmount } = renderHook(() => useLumoAgent(config));
            const { chain } = await sendAndPinConfirm(result);
            await abandon(result, unmount);
            await act(async () => {
                await chain;
            });

            expect(telemetry.confirmAnswered).toHaveBeenCalledWith('move_items', LumoConfirmAnswer.ABANDONED);
            expect(telemetry.confirmAnswered).not.toHaveBeenCalledWith('move_items', LumoConfirmAnswer.CANCELLED);
        });

        it('does not report a prompt it refuses to send', async () => {
            const { result } = renderHook(() => useLumoAgent(config));
            await act(async () => {
                await result.current.send('   ');
            });

            expect(telemetry.promptSent).not.toHaveBeenCalled();
        });
    });
});
