import type { ToolDefinition } from '../contracts/types';
import { LOAD_GUIDE_TOOL_NAME, createLoadGuideDefinition } from './loadGuide';

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

    it('names the requested tool on its chip', () => {
        const definition = createLoadGuideDefinition([def('search', { needsGuide: true, guide: 'SEARCH GUIDE' })]);

        expect(definition?.summarizeChip({ guide: 'search' }, undefined)).toEqual({
            label: 'Loaded the search guide',
        });
    });
});
