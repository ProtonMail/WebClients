import type { ToolDefinition } from '../contracts/types';
import { buildToolDescriptors } from './tools';

/**
 * Fixtures are deliberately generic — the framework is product-blind, so these tests assert descriptor
 * construction with fabricated tools rather than any product's real catalogue.
 */
const def = (name: string, overrides: Partial<ToolDefinition> = {}): ToolDefinition => ({
    name,
    kind: 'read',
    toolDescription: `does ${name}`,
    paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    serializeForLumo: () => '',
    summarizeChip: () => ({ label: name }),
    ...overrides,
});

const TOOLS: ToolDefinition[] = [def('view_items'), def('needs_guide', { needsGuide: true })];

const findDef = (name: string) => TOOLS.find((tool) => tool.name === name) as ToolDefinition;

describe('buildToolDescriptors', () => {
    it('builds one OpenAI function descriptor per active tool, from its description + schema', () => {
        const tools = buildToolDescriptors(TOOLS, []);

        const viewItems = tools.find((tool) => tool.function.name === 'view_items');
        expect(viewItems).toBeDefined();
        expect(viewItems!.type).toBe('function');
        expect(viewItems!.function.description).toBe(findDef('view_items').toolDescription);
        expect(viewItems!.function.parameters).toBe(findDef('view_items').paramsSchema);
    });

    it('every descriptor schema is $ref-free and locks additionalProperties: false', () => {
        for (const tool of buildToolDescriptors(TOOLS, ['needs_guide'])) {
            const serialized = JSON.stringify(tool.function.parameters);
            expect(serialized).not.toContain('$ref');
            expect(tool.function.parameters.additionalProperties).toBe(false);
        }
    });

    it('advertises a guide-gated tool only once its guide is loaded', () => {
        const before = buildToolDescriptors(TOOLS, []).map((tool) => tool.function.name);
        expect(before).not.toContain('needs_guide');

        const after = buildToolDescriptors(TOOLS, ['needs_guide']).map((tool) => tool.function.name);
        expect(after).toContain('needs_guide');
    });
});
