import {
    CREATE_ARTIFACT_TOOL_NAME,
    createArtifactToolExecutor,
    parseCompleteArtifactToolCall,
    parsePartialArtifactToolCall,
} from './createArtifactTool';

describe('createArtifactToolExecutor', () => {
    it('advertises the create_artifact function tool', async () => {
        const tools = await createArtifactToolExecutor.getClientTools!();

        expect(tools).toHaveLength(1);
        expect(tools[0]!.function.name).toBe(CREATE_ARTIFACT_TOOL_NAME);
        expect(tools[0]!.function.parameters!.required).toEqual(['id', 'type', 'title', 'content']);
    });

    it('only claims its own tool name', () => {
        expect(createArtifactToolExecutor.canExecute(CREATE_ARTIFACT_TOOL_NAME)).toBe(true);
        expect(createArtifactToolExecutor.canExecute('web_search')).toBe(false);
    });

    it('acknowledges every call it executes', async () => {
        const results = await createArtifactToolExecutor.execute([
            { id: 'call_1', name: CREATE_ARTIFACT_TOOL_NAME, arguments: '{}' },
        ]);

        expect(results).toHaveLength(1);
        expect(JSON.parse(results[0]!.content)).toMatchObject({ ok: true });
    });
});

describe('parsePartialArtifactToolCall', () => {
    it('exposes fields as soon as their value is closed, streaming content live', () => {
        const raw =
            '{"id":"fib-1","type":"code","title":"Fibonacci","language":"python","content":"def fib(n):\\n  ret';
        const streaming = parsePartialArtifactToolCall(raw);

        expect(streaming.id).toBe('fib-1');
        expect(streaming.type).toBe('code');
        expect(streaming.title).toBe('Fibonacci');
        expect(streaming.language).toBe('python');
        expect(streaming.content).toBe('def fib(n):\n  ret');
        expect(streaming.isComplete).toBe(false);
    });

    it('never regresses content as more of the arguments blob streams in, char by char', () => {
        const full =
            '{"id":"doc-1","type":"document","title":"Notes","content":"first line\\nsecond line with \\"quotes\\""}';
        let previousLength = 0;
        for (let end = 1; end <= full.length; end++) {
            const { content } = parsePartialArtifactToolCall(full.slice(0, end));
            expect(content.length).toBeGreaterThanOrEqual(previousLength);
            previousLength = content.length;
        }
        expect(previousLength).toBe('first line\nsecond line with "quotes"'.length);
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
});
