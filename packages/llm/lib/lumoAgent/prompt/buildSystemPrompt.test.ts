import type { ToolDefinition } from '../contracts/types';
import { buildSystemPrompt } from './buildSystemPrompt';

// Generic fixtures — the framework is product-blind; these assert composition, not any product's wording.
const def = (name: string, overrides: Partial<ToolDefinition> = {}): ToolDefinition => ({
    name,
    kind: 'read',
    toolDescription: `does ${name}`,
    paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    serializeForLumo: () => '',
    summarizeChip: () => ({ label: name }),
    ...overrides,
});

const viewItems = def('view_items', { examples: [{ context: 'the list is empty', call: { limit: 10 } }] });
const makeFilter = def('make_filter', {
    kind: 'mutation',
    needsGuide: true,
    guide: 'THE FILTER GUIDE BODY',
    examples: [{ context: 'user wants a rule', call: { field: 'from' } }],
});
const DEFINITIONS: ToolDefinition[] = [viewItems, makeFilter];

describe('buildSystemPrompt', () => {
    it('always includes the generic protocol base (turn mechanics + references)', () => {
        const prompt = buildSystemPrompt({ definitions: DEFINITIONS, loadedGuides: [] });
        expect(prompt).toContain('Each individual turn produces exactly one of');
        expect(prompt).toContain('A task runs over AS MANY turns as it needs');
        expect(prompt).toContain('may ride along in the SAME message as the call');
        expect(prompt).toContain('the call has to be in the message');
        expect(prompt).toContain('The review card IS the confirmation');
        expect(prompt).toContain('referenced by references');
    });

    it('injects the product rules block verbatim, after the base', () => {
        const productRules = '## Proton Mail rules\nNever permanently delete mail.';
        const prompt = buildSystemPrompt({ definitions: DEFINITIONS, loadedGuides: [], productRules });
        expect(prompt).toContain(productRules);
        expect(prompt.indexOf('## How each turn works')).toBeLessThan(prompt.indexOf(productRules));
    });

    it('omits the product rules block when none (or only whitespace) is supplied', () => {
        expect(buildSystemPrompt({ definitions: DEFINITIONS, loadedGuides: [] })).not.toContain('## Product');
        const blank = buildSystemPrompt({ definitions: DEFINITIONS, loadedGuides: [], productRules: '   \n ' });
        expect(blank).toBe(buildSystemPrompt({ definitions: DEFINITIONS, loadedGuides: [] }));
    });

    it('injects examples only for tools ACTIVE this turn (progressive disclosure)', () => {
        const withoutGuide = buildSystemPrompt({ definitions: DEFINITIONS, loadedGuides: [] });
        expect(withoutGuide).toContain('### view_items');
        expect(withoutGuide).toContain('Correct call: view_items({"limit":10})');
        // make_filter needs its guide loaded before its examples appear.
        expect(withoutGuide).not.toContain('### make_filter');

        const withGuide = buildSystemPrompt({ definitions: DEFINITIONS, loadedGuides: ['make_filter'] });
        expect(withGuide).toContain('### make_filter');
        expect(withGuide).toContain('Correct call: make_filter({"field":"from"})');
    });

    it('injects a loaded guide body once, and not before it is loaded', () => {
        expect(buildSystemPrompt({ definitions: DEFINITIONS, loadedGuides: [] })).not.toContain(
            'THE FILTER GUIDE BODY'
        );

        const withGuide = buildSystemPrompt({ definitions: DEFINITIONS, loadedGuides: ['make_filter'] });
        expect(withGuide).toContain('## Guide: make_filter');
        expect(withGuide.split('THE FILTER GUIDE BODY').length - 1).toBe(1);
    });

    it('dedupes two tools that share one guide body', () => {
        const other = def('update_filter', { needsGuide: true, guide: 'THE FILTER GUIDE BODY' });
        const prompt = buildSystemPrompt({
            definitions: [...DEFINITIONS, other],
            loadedGuides: ['make_filter', 'update_filter'],
        });
        expect(prompt.split('THE FILTER GUIDE BODY').length - 1).toBe(1);
    });

    it('re-resolves a thunk guide on every build, so a body that has since changed is the one emitted', () => {
        let body = 'MATCHING IS BY SUBSTRING';
        const search = def('search', { needsGuide: true, guide: () => body });
        const config = { definitions: [search], loadedGuides: ['search'] };

        expect(buildSystemPrompt(config)).toContain('MATCHING IS BY SUBSTRING');

        body = 'OPERATORS ARE LIVE';
        const next = buildSystemPrompt(config);
        expect(next).toContain('OPERATORS ARE LIVE');
        expect(next).not.toContain('MATCHING IS BY SUBSTRING');
    });

    it('dedupes two thunk guides returning the same body, which are only equal once resolved', () => {
        const prompt = buildSystemPrompt({
            definitions: [
                def('search', { needsGuide: true, guide: () => 'THE SHARED GUIDE BODY' }),
                def('search_thread', { needsGuide: true, guide: () => 'THE SHARED GUIDE BODY' }),
            ],
            loadedGuides: ['search', 'search_thread'],
        });

        expect(prompt.split('THE SHARED GUIDE BODY').length - 1).toBe(1);
    });

    it('accepts loadedGuides as a Set as well as an array', () => {
        const asArray = buildSystemPrompt({ definitions: DEFINITIONS, loadedGuides: ['make_filter'] });
        const asSet = buildSystemPrompt({ definitions: DEFINITIONS, loadedGuides: new Set(['make_filter']) });
        expect(asSet).toBe(asArray);
    });
});
