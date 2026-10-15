import {
    CREATE_ARTIFACT_TOOL_NAME,
    createArtifactToolExecutor,
    parseCompleteArtifactToolCall,
} from './createArtifactTool';

describe('createArtifactToolExecutor', () => {
    it('advertises the create_artifact function tool', async () => {
        const tools = await createArtifactToolExecutor({ slideFormat: 'html' }).getClientTools!();

        expect(tools).toHaveLength(1);
        expect(tools[0]!.function.name).toBe(CREATE_ARTIFACT_TOOL_NAME);
        expect(tools[0]!.function.parameters!.required).toEqual(['id', 'type', 'title', 'content']);
    });

    // D12: the same Vega-Lite version as the chat [Visualization] rules, one embed syntax per
    // artifact type, and no chat-only card blocks inside artifacts.
    it('scopes chart embedding per artifact type and keeps cards out of artifacts', async () => {
        const tools = await createArtifactToolExecutor({ slideFormat: 'html' }).getClientTools!();
        const description = tools[0]!.function.description ?? '';

        expect(description).toContain('vega-lite/v6.json');
        expect(description).not.toMatch(/Vega-Lite v5/);
        expect(description).toContain('application/lumo-vega-lite+json');
        expect(description).toContain('never use a ```vega-lite fence in a slide');
        expect(description).toContain('In a `document`, put a chart in a ```vega-lite fenced block');
        expect(description).toContain('Never put ```card-row or ```card blocks in any artifact');
    });

    // D18: with LumoArtifactSlides, decks are JSON for the native .pptx, and the data rules are explicit.
    it('asks for JSON decks instead of slide HTML when the deck format is on', async () => {
        const tools = await createArtifactToolExecutor({ slideFormat: 'deck' }).getClientTools!();
        const description = tools[0]!.function.description ?? '';

        expect(description).toContain('`content` is a JSON object (as a string), never HTML');
        expect(description).toContain(
            '{"layout": "chart", "title": string, "chart": {"missing": "what data is needed"}}'
        );
        expect(description).toContain('Never invent data');
        expect(description).not.toContain('<section>');
        expect(description).not.toContain('application/lumo-vega-lite+json');
        expect(description).toContain('In a `document`, put a chart in a ```vega-lite fenced block');
    });

    it('keeps a deck sent as a JSON object as JSON text', () => {
        const deck = { title: 'Q3', slides: [{ layout: 'title', title: 'Q3' }] };
        const artifact = parseCompleteArtifactToolCall({ id: 'q3', type: 'presentation', title: 'Q3', content: deck });

        expect(artifact?.content).toBe(JSON.stringify(deck));
    });

    it("takes a deck's title from the deck when the tool call leaves it out", () => {
        const content = JSON.stringify({ title: 'Q3 Results', slides: [{ layout: 'title', title: 'Q3 Results' }] });
        const artifact = parseCompleteArtifactToolCall({ id: 'q3', type: 'presentation', content });

        expect(artifact?.title).toBe('Q3 Results');
        expect(parseCompleteArtifactToolCall({ id: 'doc', type: 'document', content: 'Hello' })).toBeNull();
    });

    it('only claims its own tool name', () => {
        expect(createArtifactToolExecutor({ slideFormat: 'html' }).canExecute(CREATE_ARTIFACT_TOOL_NAME)).toBe(true);
        expect(createArtifactToolExecutor({ slideFormat: 'html' }).canExecute('web_search')).toBe(false);
    });

    it('acknowledges every call it executes', async () => {
        const results = await createArtifactToolExecutor({ slideFormat: 'html' }).execute([
            { id: 'call_1', name: CREATE_ARTIFACT_TOOL_NAME, arguments: '{}' },
        ]);

        expect(results).toHaveLength(1);
        expect(JSON.parse(results[0]!.content)).toMatchObject({ ok: true });
    });
});

describe('parseCompleteArtifactToolCall', () => {
    it('builds a complete artifact from fully-parsed arguments', () => {
        const args = { id: 'fib-1', type: 'code', title: 'Fibonacci', language: 'python', content: 'def fib(n): ...' };
        const artifact = parseCompleteArtifactToolCall(args);

        expect(artifact).toEqual({
            id: 'fib-1',
            type: 'code',
            language: 'python',
            title: 'Fibonacci',
            content: 'def fib(n): ...',
        });
    });

    it('defaults language to text for code artifacts that omit it', () => {
        const artifact = parseCompleteArtifactToolCall({ id: 'x', type: 'code', title: 'X', content: 'x' });

        expect(artifact?.language).toBe('text');
    });

    it('falls back to a stable hashed id if the model omits the required id field', () => {
        const args = { type: 'document', title: 'Notes', content: 'hello' };
        const first = parseCompleteArtifactToolCall(args);
        const second = parseCompleteArtifactToolCall({ ...args });

        expect(first?.id).toMatch(/^legacy-/);
        expect(first?.id).toBe(second?.id);
    });

    it('returns null only when title or content is missing (no reasonable fallback exists)', () => {
        expect(parseCompleteArtifactToolCall({ type: 'code', content: 'x' })).toBeNull();
        expect(parseCompleteArtifactToolCall({ id: 'x', type: 'code', title: 'X' })).toBeNull();
    });

    it('infers type "code" when the model omits `type` but supplies a `language` (real observed backend behavior)', () => {
        // This backend doesn't enforce the schema's `required: [..., 'type', ...]` — reproduces a
        // live tool call that came back with id/title/language/content but no `type` at all.
        const artifact = parseCompleteArtifactToolCall({
            id: 'mariokart-username-generator',
            language: 'javascript',
            title: 'Mario Kart Username Generator',
            content: 'function generateUsername() {}',
        });

        expect(artifact?.type).toBe('code');
        expect(artifact?.language).toBe('javascript');
    });

    it('infers type "document" when the model omits both `type` and `language`', () => {
        const artifact = parseCompleteArtifactToolCall({
            id: 'letter-1',
            title: 'Landlord Letter',
            content: 'Dear...',
        });

        expect(artifact?.type).toBe('document');
        expect(artifact?.language).toBeUndefined();
    });

    it('round-trips an explicit "presentation" type', () => {
        const artifact = parseCompleteArtifactToolCall({
            id: 'quarterly-review',
            type: 'presentation',
            title: 'Quarterly Review',
            content: '<section>Slide 1</section><section>Slide 2</section>',
        });

        expect(artifact?.type).toBe('presentation');
        expect(artifact?.language).toBeUndefined();
    });

    it('never infers "presentation" — omitting `type` falls back to code/document like webpage does', () => {
        const artifact = parseCompleteArtifactToolCall({
            id: 'x',
            title: 'X',
            content: '<section>Slide 1</section>',
        });

        expect(artifact?.type).toBe('document');
    });
});
