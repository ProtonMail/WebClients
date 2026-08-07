import type { ToolDefinition } from '../contracts/types';
import { LOAD_GUIDE_TOOL_NAME, createLoadGuideDefinition, resolveGuide } from './loadGuide';

const def = (name: string, overrides: Partial<ToolDefinition> = {}): ToolDefinition => ({
    name,
    kind: 'read',
    toolDescription: `does ${name}`,
    paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    serializeForLumo: () => '',
    summarizeChip: () => ({ label: name }),
    ...overrides,
});

describe('createLoadGuideDefinition', () => {
    it('is not built when no tool needs a guide', () => {
        expect(createLoadGuideDefinition([def('view_items')])).toBeUndefined();
    });

    it('enumerates exactly the guide-bearing tools, so an absent guide cannot be requested', () => {
        const definition = createLoadGuideDefinition([
            def('view_items'),
            def('search', { needsGuide: true, guide: 'SEARCH GUIDE' }),
            def('create_filter', { needsGuide: true, guide: 'SIEVE GUIDE' }),
            def('half_declared', { needsGuide: true }),
        ]);

        expect(definition?.name).toBe(LOAD_GUIDE_TOOL_NAME);
        expect(definition?.paramsSchema.properties.guide.enum).toEqual(['search', 'create_filter']);
        expect(definition?.toolDescription).toContain('search, create_filter');
    });

    it('keeps a tool whose guide is a thunk in the catalogue, unresolved', () => {
        const definition = createLoadGuideDefinition([def('search', { needsGuide: true, guide: () => 'LAZY GUIDE' })]);

        expect(definition?.paramsSchema.properties.guide.enum).toEqual(['search']);
    });

    it('names the requested tool on its chip', () => {
        const definition = createLoadGuideDefinition([def('search', { needsGuide: true, guide: 'SEARCH GUIDE' })]);

        expect(definition?.summarizeChip({ guide: 'search' }, undefined)).toEqual({
            label: 'Loaded the search guide',
        });
    });
});

describe('resolveGuide', () => {
    it('reads a plain string guide as-is', () => {
        expect(resolveGuide(def('search', { guide: 'SEARCH GUIDE' }))).toBe('SEARCH GUIDE');
    });

    it('calls a thunk guide, so a body built from live state is current at read time', () => {
        let body = 'FIRST';
        const search = def('search', { guide: () => body });

        expect(resolveGuide(search)).toBe('FIRST');
        body = 'SECOND';
        expect(resolveGuide(search)).toBe('SECOND');
    });

    it('is undefined for a tool with no guide', () => {
        expect(resolveGuide(def('view_items'))).toBeUndefined();
    });

    it('is undefined when a thunk throws, so live-state guidance cannot take down its caller', () => {
        const search = def('search', {
            guide: () => {
                throw new Error('deps not ready');
            },
        });

        expect(() => resolveGuide(search)).not.toThrow();
        expect(resolveGuide(search)).toBeUndefined();
    });
});
