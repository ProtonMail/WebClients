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
});
