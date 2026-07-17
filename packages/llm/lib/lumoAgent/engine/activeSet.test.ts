import type { ToolDefinition } from '../contracts/types';
import { getActiveTools } from './activeSet';

/**
 * Progressive disclosure: guide-bearing tools and their heavy guide bodies must stay out of context
 * until the model loads them. This guards the goal — a tool whose usage needs a guide is not part of
 * the active set (and so is never advertised) until its guide has been pulled via `load_guide`.
 *
 * Fixtures are deliberately generic — the framework is product-blind, so these tests assert the
 * narrowing behaviour with fabricated tools rather than any product's real catalogue.
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

const TOOLS: ToolDefinition[] = [
    def('always_on'),
    def('another_always_on', { kind: 'mutation' }),
    def('needs_guide_a', { needsGuide: true }),
    def('needs_guide_b', { needsGuide: true }),
];

describe('getActiveTools', () => {
    it('excludes guide-bearing tools until their guide is loaded', () => {
        const names = getActiveTools(TOOLS, []).map((tool) => tool.name);
        expect(names).toContain('always_on');
        expect(names).toContain('another_always_on');
        expect(names).not.toContain('needs_guide_a');
        expect(names).not.toContain('needs_guide_b');
    });

    it('admits a guide-bearing tool (and only it) once its guide is loaded', () => {
        const names = getActiveTools(TOOLS, ['needs_guide_a']).map((tool) => tool.name);
        expect(names).toContain('needs_guide_a');
        expect(names).not.toContain('needs_guide_b');
    });

    it('accepts loadedGuides as either a Set or an array', () => {
        const fromArray = getActiveTools(TOOLS, ['needs_guide_b']).map((tool) => tool.name);
        const fromSet = getActiveTools(TOOLS, new Set(['needs_guide_b'])).map((tool) => tool.name);
        expect(fromArray).toEqual(fromSet);
        expect(fromSet).toContain('needs_guide_b');
    });
});
