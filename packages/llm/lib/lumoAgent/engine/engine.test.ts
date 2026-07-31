import type {
    ChatCompletionsFunctionTool,
    PendingClientToolCall,
    ToolName as TransportToolName,
} from '@proton/lumo-api-client';

import type { ActionRequest, ToolName as FrameworkToolName, ToolDefinition, ToolHandlers } from '../contracts/types';
import type { ConfirmController, ConfirmDecision, ToolChip } from './engine';
import { createClientToolExecutor } from './engine';
import { createReferenceRegistry } from './referenceRegistry';

// Fabricated tools + handlers + scripted calls — the framework is product-blind.

const OBJECT_SCHEMA = (properties: Record<string, any>, required: string[] = []) => ({
    type: 'object',
    additionalProperties: false,
    required,
    properties,
});

const def = (name: string, overrides: Partial<ToolDefinition> = {}): ToolDefinition => ({
    name,
    kind: 'read',
    toolDescription: `does ${name}`,
    paramsSchema: OBJECT_SCHEMA({}),
    serializeForLumo: () => '',
    summarizeChip: () => ({ label: name }),
    ...overrides,
});

const call = (name: string, args: Record<string, any> = {}, id = `id-${name}`): PendingClientToolCall => ({
    id,
    name,
    arguments: JSON.stringify(args),
});

/** A confirm controller that answers with a scripted decision and records what it was shown. */
const scriptedConfirm = (
    decision: ConfirmDecision
): ConfirmController & { calls: { action: ActionRequest; labels: Record<string, string> }[] } => {
    const calls: { action: ActionRequest; labels: Record<string, string> }[] = [];
    return {
        calls,
        requestConfirmation: async (action, labels) => {
            calls.push({ action, labels });
            return decision;
        },
    };
};

const viewItems = def('view_items', {
    serializeForLumo: (result: { count: number }) => `${result.count} items`,
    summarizeChip: (_p, result: { count: number }) => ({ label: `Read ${result.count} items` }),
});
const readItem = def('read_item', {
    paramsSchema: OBJECT_SCHEMA({ item: { type: 'string' } }, ['item']),
    serializeForLumo: () => 'read one item',
});
const moveItems = def('move_items', {
    kind: 'mutation',
    paramsSchema: OBJECT_SCHEMA({ target: { type: 'string' } }, ['target']),
    serializeForLumo: () => '',
});
const createLabel = def('create_label', {
    kind: 'mutation',
    paramsSchema: OBJECT_SCHEMA({ name: { type: 'string' } }, ['name']),
    serializeForLumo: (result: { reference: string }) => `New label is ${result.reference}.`,
});
const makeFilter = def('make_filter', { needsGuide: true, guide: 'THE GUIDE' });
const loadGuide = def('load_guide', {
    paramsSchema: OBJECT_SCHEMA({ guide: { type: 'string' } }, ['guide']),
    summarizeChip: () => ({ label: 'Loaded a guide' }),
});

const DEFINITIONS: ToolDefinition[] = [viewItems, readItem, moveItems, createLabel, makeFilter, loadGuide];

const setup = (overrides: Partial<Parameters<typeof createClientToolExecutor>[0]> = {}) => {
    const references = createReferenceRegistry();
    const handlerCalls: { name: string; params: Record<string, any> }[] = [];
    const handlers: ToolHandlers = {
        view_items: async () => ({ count: 2 }),
        read_item: async () => ({}),
        move_items: async (params) => {
            handlerCalls.push({ name: 'move_items', params });
            return {};
        },
        create_label: async (params) => {
            handlerCalls.push({ name: 'create_label', params });
            return { reference: references.referenceFor('label', 'new-real-id', params.name) };
        },
        ...overrides.handlers,
    };
    const chips: ToolChip[] = [];
    const executor = createClientToolExecutor({
        definitions: DEFINITIONS,
        handlers,
        references,
        confirm: scriptedConfirm({ action: 'apply', params: { target: 'x' } }),
        onChip: (chip) => chips.push(chip),
        ...overrides,
    });
    return { executor, references, handlerCalls, chips };
};

describe('createClientToolExecutor', () => {
    describe('getClientTools', () => {
        it('advertises only the tools active this turn, and widens after load_guide', async () => {
            const { executor } = setup();
            const before = (await executor.getClientTools!()).map((tool) => tool.function.name);
            expect(before).toContain('view_items');
            expect(before).not.toContain('make_filter'); // guarded behind its guide

            await executor.execute([call('load_guide', { guide: 'make_filter' })]);

            const after = (await executor.getClientTools!()).map((tool) => tool.function.name);
            expect(after).toContain('make_filter');
        });

        it('returns the guide BODY as the load_guide result, since the prompt is fixed for the loop', async () => {
            const { executor } = setup();

            const [result] = await executor.execute([call('load_guide', { guide: 'make_filter' })]);

            expect(result.is_error).toBeUndefined();
            expect(result.content).toContain('THE GUIDE');
        });

        it('reports an unknown guide as an error without loading anything', async () => {
            const { executor } = setup();

            const [result] = await executor.execute([call('load_guide', { guide: 'view_items' })]);

            expect(result.is_error).toBe(true);
            expect(executor.getLoadedGuides()).toEqual([]);
        });
    });

    describe('getLoadedGuides', () => {
        it('exposes loaded guides so the next message can carry them in its prompt', async () => {
            const { executor } = setup();
            expect(executor.getLoadedGuides()).toEqual([]);

            await executor.execute([call('load_guide', { guide: 'make_filter' })]);

            expect(executor.getLoadedGuides()).toEqual(['make_filter']);
        });

        it('returns a value assignable to the transport ChatCompletionsFunctionTool[]', async () => {
            const { executor } = setup();
            const tools: ChatCompletionsFunctionTool[] = await executor.getClientTools!();
            expect(tools[0].type).toBe('function');
        });
    });

    describe('canExecute', () => {
        it('claims registered tools (including load_guide) and disowns unknown ones', () => {
            const { executor } = setup();
            expect(executor.canExecute('view_items')).toBe(true);
            expect(executor.canExecute('load_guide')).toBe(true);
            expect(executor.canExecute('not_a_tool')).toBe(false);
        });
    });

    describe('normalizeCalls', () => {
        it('is identity by default', () => {
            const { executor } = setup();
            const calls = [call('view_items')];
            expect(executor.normalizeCalls!(calls)).toEqual(calls);
        });

        it('remaps names through the injected normalizer (aliasing model mistakes)', () => {
            const { executor } = setup({ normalizeName: (name) => (name === 'move_item' ? 'move_items' : name) });
            const [normalized] = executor.normalizeCalls!([call('move_item', { target: 'x' })]);
            expect(normalized.name).toBe('move_items');
        });
    });

    describe('execute — reads', () => {
        it('runs the handler, serialises the result, and emits a chip', async () => {
            const { executor, chips } = setup();
            const [result] = await executor.execute([call('view_items')]);
            expect(result).toEqual({ content: '2 items' });
            expect(chips).toEqual([{ tool: 'view_items', summary: { label: 'Read 2 items' }, payload: '2 items' }]);
        });

        it('feeds a validation error back as an error result (self-correction)', async () => {
            const { executor } = setup();
            const [result] = await executor.execute([call('read_item', {})]); // missing required `item`
            expect(result.is_error).toBe(true);
            expect(result.content).toContain('missing required field');
        });

        it('rejects a reference the registry never issued, but accepts a minted one', async () => {
            const { executor, references } = setup();

            const [bad] = await executor.execute([call('read_item', { item: 'email-zzzzzz' })]);
            expect(bad.is_error).toBe(true);
            expect(bad.content).toContain('Unknown reference');

            const minted = references.referenceFor('email', 'real-id');
            const [good] = await executor.execute([call('read_item', { item: minted })]);
            expect(good).toEqual({ content: 'read one item' });
        });

        it('reports an unknown tool as an error result', async () => {
            const { executor } = setup();
            const [result] = await executor.execute([call('nope')]);
            expect(result.is_error).toBe(true);
            expect(result.content).toContain('Unknown tool');
        });

        it('feeds a handler failure back as a recoverable error result', async () => {
            const { executor } = setup({
                handlers: {
                    view_items: async () => {
                        throw new Error('boom');
                    },
                },
            });
            const [result] = await executor.execute([call('view_items')]);
            expect(result.is_error).toBe(true);
            expect(result.content).toContain('view_items');
        });
    });

    describe('execute — mutations (confirm inside execute)', () => {
        it('awaits confirm, runs the handler with the (edited) params, and returns a success line', async () => {
            const handled: Record<string, any>[] = [];
            const executor = createClientToolExecutor({
                definitions: DEFINITIONS,
                references: createReferenceRegistry(),
                handlers: {
                    move_items: async (params) => {
                        handled.push(params);
                        return {};
                    },
                },
                confirm: scriptedConfirm({ action: 'apply', params: { target: 'editedTarget' } }),
            });

            const [result] = await executor.execute([call('move_items', { target: 'modelTarget' })]);

            expect(handled).toEqual([{ target: 'editedTarget' }]);
            expect(result.is_error).toBeUndefined();
            expect(result.content).toContain('Applied move_items successfully');
            expect(result.content).toContain('You MUST now respond');
        });

        it('surfaces reference labels to the confirm card', async () => {
            const references = createReferenceRegistry();
            const ref = references.referenceFor('folder', 'real-folder', 'Hotels');
            const confirm = scriptedConfirm({ action: 'apply', params: { target: ref } });
            const executor = createClientToolExecutor({
                definitions: DEFINITIONS,
                references,
                handlers: { move_items: async () => ({}) },
                confirm,
            });

            await executor.execute([call('move_items', { target: ref })]);
            expect(confirm.calls[0].action).toEqual({ type: 'move_items', target: ref });
            expect(confirm.calls[0].labels).toEqual({ [ref]: 'Hotels' });
        });

        it('does NOT run the handler when the user cancels, and tells the model so', async () => {
            const handlerCalls: string[] = [];
            const executor = createClientToolExecutor({
                definitions: DEFINITIONS,
                references: createReferenceRegistry(),
                handlers: {
                    move_items: async () => {
                        handlerCalls.push('move_items');
                        return {};
                    },
                },
                confirm: scriptedConfirm({ action: 'cancel' }),
            });

            const [result] = await executor.execute([call('move_items', { target: 'x' })]);
            expect(handlerCalls).toEqual([]);
            expect(result.is_error).toBeUndefined();
            expect(result.content).toContain('declined');
        });

        it('serialises a created entity reference into the success line for chaining', async () => {
            const references = createReferenceRegistry();
            const executor = createClientToolExecutor({
                definitions: DEFINITIONS,
                references,
                handlers: {
                    create_label: async (params) => ({
                        reference: references.referenceFor('label', 'r1', params.name),
                    }),
                },
                confirm: scriptedConfirm({ action: 'apply', params: { name: 'Work' } }),
            });
            const [result] = await executor.execute([call('create_label', { name: 'Work' })]);
            expect(result.content).toMatch(/Applied create_label successfully\. New label is label-[0-9a-z]{6}\./);
        });

        it('rejects a mutation when no confirm controller is configured', async () => {
            const executor = createClientToolExecutor({
                definitions: DEFINITIONS,
                references: createReferenceRegistry(),
                handlers: { move_items: async () => ({}) },
            });
            const [result] = await executor.execute([call('move_items', { target: 'x' })]);
            expect(result.is_error).toBe(true);
        });
    });

    describe('execute — ordering', () => {
        it('returns one result per call, in the same order', async () => {
            const { executor, references } = setup();
            const minted = references.referenceFor('email', 'real-id');
            const results = await executor.execute([
                call('view_items', {}, 'a'),
                call('read_item', { item: minted }, 'b'),
                call('nope', {}, 'c'),
            ]);
            expect(results.map((result) => result.content)).toEqual([
                '2 items',
                'read one item',
                expect.stringContaining('Unknown tool'),
            ]);
        });
    });
});

// Framework and transport both export `ToolName`; a consumer importing both must alias one.
describe('ToolName reconciliation', () => {
    it('the framework and transport ToolName types coexist under distinct aliases', () => {
        const frameworkName: FrameworkToolName = 'move_items';
        const transportName: TransportToolName = 'web_search';
        expect(frameworkName).toBe('move_items');
        expect(transportName).toBe('web_search');
    });
});
