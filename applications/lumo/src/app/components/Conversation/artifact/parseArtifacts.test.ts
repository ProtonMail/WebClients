import { parseArtifacts, parseStreamingContent } from './parseArtifacts';

describe('parseArtifacts', () => {
    it('parses an artifact with an explicit id', () => {
        const raw =
            'Here you go:\n<artifact id="report-outline" type="document" title="Report Outline">\nContent\n</artifact>';
        const { prose, artifacts } = parseArtifacts(raw);

        expect(prose).toBe('Here you go:');
        expect(artifacts).toHaveLength(1);
        expect(artifacts[0]).toMatchObject({
            id: 'report-outline',
            type: 'document',
            title: 'Report Outline',
            content: 'Content',
        });
    });

    it('synthesizes a stable fallback id when the tag omits one', () => {
        const raw = '<artifact type="code" language="python" title="Fib">print(1)</artifact>';
        const first = parseArtifacts(raw);
        const second = parseArtifacts(raw);

        expect(first.artifacts[0]!.id).toMatch(/^legacy-/);
        expect(first.artifacts[0]!.id).toBe(second.artifacts[0]!.id);
    });

    it('reuses the same id across two separate parses when the tag reuses it (revision)', () => {
        const v1 = parseArtifacts('<artifact id="poem" type="document" title="Poem">Roses are red</artifact>');
        const v2 = parseArtifacts(
            '<artifact id="poem" type="document" title="Poem">Roses are red, violets are blue</artifact>'
        );

        expect(v1.artifacts[0]!.id).toBe('poem');
        expect(v2.artifacts[0]!.id).toBe('poem');
        expect(v1.artifacts[0]!.id).toBe(v2.artifacts[0]!.id);
    });

    it('skips only a malformed tag instead of dropping every artifact in the message', () => {
        const raw = [
            '<artifact id="good" type="document" title="Good One">valid content</artifact>',
            '<artifact type="bogus" title="Bad Type">should be skipped</artifact>',
            '<artifact id="good-2" type="code" language="python" title="Good Two">print(2)</artifact>',
        ].join('\n');

        const { artifacts } = parseArtifacts(raw);

        expect(artifacts).toHaveLength(2);
        expect(artifacts.map((a) => a.id)).toEqual(['good', 'good-2']);
    });

    it('skips a tag missing the required title attribute', () => {
        const raw = '<artifact id="no-title" type="document">missing title</artifact>';
        const { artifacts } = parseArtifacts(raw);

        expect(artifacts).toHaveLength(0);
    });

    it('does not truncate the attribute list when a title contains a literal >', () => {
        const raw = '<artifact id="cmp" type="code" language="python" title="if x > y">print(1)</artifact>';
        const { artifacts } = parseArtifacts(raw);

        expect(artifacts).toHaveLength(1);
        expect(artifacts[0]).toMatchObject({ title: 'if x > y', content: 'print(1)' });
    });
});

describe('parseStreamingContent', () => {
    it('carries the id through on a completed artifact while streaming', () => {
        const raw = 'Intro\n<artifact id="snippet-1" type="code" language="js" title="Snippet">const x = 1;</artifact>';
        const { completeArtifacts, streamingArtifact } = parseStreamingContent(raw);

        expect(completeArtifacts).toHaveLength(1);
        expect(completeArtifacts[0]!.id).toBe('snippet-1');
        expect(streamingArtifact).toBeNull();
    });

    it('exposes the id as soon as the opening tag is seen, before the closing tag arrives', () => {
        const raw = '<artifact id="snippet-2" type="code" language="js" title="Snippet">const x =';
        const { streamingArtifact } = parseStreamingContent(raw);

        expect(streamingArtifact).not.toBeNull();
        expect(streamingArtifact?.id).toBe('snippet-2');
        expect(streamingArtifact?.content).toBe('const x =');
    });

    it('keeps the tag open when a title attribute contains a literal >', () => {
        const raw = '<artifact id="snippet-3" type="code" language="js" title="if x > y">const x =';
        const { streamingArtifact } = parseStreamingContent(raw);

        expect(streamingArtifact).not.toBeNull();
        expect(streamingArtifact?.title).toBe('if x > y');
        expect(streamingArtifact?.content).toBe('const x =');
    });

    it('stays open mid-attribute when a title value contains a literal > and the closing quote has not arrived yet', () => {
        // The exact byte-for-byte moment that used to be lost: `title="if x >` has an unquoted-looking
        // `>` but the value's closing `"` hasn't streamed in yet, so the tag must still read as open.
        const raw = '<artifact id="snippet-4" type="code" language="js" title="if x >';
        const { completeArtifacts, streamingArtifact } = parseStreamingContent(raw);

        expect(completeArtifacts).toHaveLength(0);
        expect(streamingArtifact).not.toBeNull();
        expect(streamingArtifact?.isComplete).toBe(false);
        // title can't be salvaged yet (its quote never closed) but id/type/language already did
        expect(streamingArtifact?.id).toBe('snippet-4');
        expect(streamingArtifact?.type).toBe('code');
        expect(streamingArtifact?.title).toBeUndefined();
    });

    it('stays open when in-progress content contains a partial </artifact-like substring with no closing >', () => {
        const raw =
            '<artifact id="doc-1" type="document" title="Explainer">' +
            'Here is how to use it: write </artifact at the end.';
        const { completeArtifacts, streamingArtifact } = parseStreamingContent(raw);

        expect(completeArtifacts).toHaveLength(0);
        expect(streamingArtifact).not.toBeNull();
        expect(streamingArtifact?.id).toBe('doc-1');
    });

    // NOTE: if the streamed content contains the full literal string `</artifact>` (e.g. a
    // document explaining the artifact syntax itself), COMPLETE_RE will still match on it and
    // report the artifact as complete early — that structural ambiguity isn't fixable at the
    // parser level without an escaping convention. It's mitigated one layer up: AssistantMessage's
    // effect that forwards streamingArtifact into ArtifactContext won't clear an in-progress
    // artifact to null just because the raw message still contains an unclosed `<artifact` marker,
    // so the panel doesn't flicker shut even if this parser-level edge case fires.
});
