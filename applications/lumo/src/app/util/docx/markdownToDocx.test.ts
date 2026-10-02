import JSZip from 'jszip';

import { markdownToDocxBlob } from './markdownToDocx';

const readDocxParts = async (markdown: string) => {
    const blob = await markdownToDocxBlob(markdown, { title: 'Q3 Plan', creator: 'Lumo' });
    const zip = await JSZip.loadAsync(await new Response(blob).arrayBuffer());
    const read = async (path: string) => {
        return (await zip.file(path)?.async('string')) ?? '';
    };

    return {
        document: await read('word/document.xml'),
        numbering: await read('word/numbering.xml'),
        footnotes: await read('word/footnotes.xml'),
        core: await read('docProps/core.xml'),
        relationships: await read('word/_rels/document.xml.rels'),
    };
};

const countMatches = (value: string, pattern: RegExp) => {
    return value.match(pattern)?.length ?? 0;
};

describe('markdownToDocxBlob', () => {
    it('produces a Word document with the title in its properties', async () => {
        const blob = await markdownToDocxBlob('Hello', { title: 'Q3 Plan' });
        const { core, document } = await readDocxParts('Hello');

        expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        expect(core).toContain('<dc:title>Q3 Plan</dc:title>');
        expect(document).toContain('Hello');
    });

    it('maps headings to built-in heading styles so navigation and tables of contents work', async () => {
        const { document } = await readDocxParts('# One\n\n## Two\n\n###### Six');

        expect(document).toContain('<w:pStyle w:val="Heading1"/>');
        expect(document).toContain('<w:pStyle w:val="Heading2"/>');
        expect(document).toContain('<w:pStyle w:val="Heading6"/>');
    });

    it('keeps inline formatting as real run properties', async () => {
        const { document } = await readDocxParts('**bold** *italic* ~~gone~~ `code`');

        expect(document).toContain('<w:b/>');
        expect(document).toContain('<w:i/>');
        expect(document).toContain('<w:strike/>');
        expect(document).toMatch(/<w:rFonts w:ascii="Courier New"/);
    });

    it('sets font, size and spacing directly so readers other than Word do not fall back to their own', async () => {
        const blob = await markdownToDocxBlob('First\n\n**Second**', { title: 'T' });
        const zip = await JSZip.loadAsync(await new Response(blob).arrayBuffer());
        const document = (await zip.file('word/document.xml')?.async('string')) ?? '';
        const styles = (await zip.file('word/styles.xml')?.async('string')) ?? '';

        expect(countMatches(document, /<w:rFonts w:ascii="Arial"/g)).toBe(2);
        expect(countMatches(document, /<w:sz w:val="22"\/>/g)).toBe(2);
        expect(countMatches(document, /<w:spacing w:after="180" w:line="300"\/>/g)).toBe(2);
        expect(styles).toContain('w:styleId="Normal"');
    });

    it('turns web links into hyperlinks and drops unsafe link targets', async () => {
        const { document, relationships } = await readDocxParts(
            '[Proton](https://proton.me) and [bad](javascript:alert(1)) and www.example.com'
        );

        expect(relationships).toContain('Target="https://proton.me"');
        expect(relationships).toContain('Target="http://www.example.com"');
        expect(relationships).not.toContain('javascript:');
        expect(document).toContain('bad');
    });

    it('numbers each ordered list independently and respects its start number', async () => {
        const { document, numbering } = await readDocxParts('1. a\n2. b\n\nText\n\n3. c\n4. d\n\n- x\n  - y');

        expect(countMatches(document, /<w:numPr>/g)).toBe(6);
        expect(numbering).toContain('<w:start w:val="3"/>');
        expect(numbering).toContain('w:val="•"');
        // The nested bullet is one level deeper.
        expect(document).toContain('<w:ilvl w:val="1"/>');
    });

    it('renders task list items with checkbox glyphs instead of bullets', async () => {
        const { document } = await readDocxParts('- [x] done\n- [ ] todo');

        expect(document).toContain('☒');
        expect(document).toContain('☐');
        expect(document).toContain('<w:ind w:left="720" w:hanging="360"/>');
        expect(document).toContain('<w:tab/>');
        expect(countMatches(document, /<w:numPr>/g)).toBe(0);
    });

    it('builds tables with a repeating header row, bold header cells, and padded short rows', async () => {
        const { document } = await readDocxParts('| Name | Score |\n|:-----|------:|\n| Ada | 10 |\n| Bob |');

        expect(countMatches(document, /<w:tr>/g)).toBe(3);
        expect(countMatches(document, /<w:tc>/g)).toBe(6);
        expect(document).toContain('<w:tblHeader/>');
        expect(document).toContain('<w:jc w:val="right"/>');
        expect(document).toContain('Ada');
    });

    it('separates consecutive tables so Word and Google Docs do not merge them, and spaces a table from the next block', async () => {
        const { document } = await readDocxParts(
            '| A | B |\n| --- | --- |\n| 1 | 2 |\n\n| C | D |\n| --- | --- |\n| 3 | 4 |\n\n---\n\n| E |\n| --- |\n| 5 |\n\nAfter'
        );

        expect(countMatches(document, /<w:tbl>/g)).toBe(4);
        expect(document).not.toMatch(/<\/w:tbl>\s*<w:tbl>/);
        expect(document).toMatch(
            /<\/w:tbl><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="180" w:lineRule="exact"\/>/
        );
    });

    it('keeps code block lines and whitespace in a single code-styled paragraph', async () => {
        const { document } = await readDocxParts('```ts\nconst a = 1;\n    return a;\n```');

        expect(document).toContain('<w:pStyle w:val="LumoCode"/>');
        expect(document).toContain('const a = 1;');
        expect(document).toContain('<w:t xml:space="preserve">    return a;</w:t>');
        expect(document).toContain('<w:br/>');
    });

    it('converts GFM footnotes to Word footnotes', async () => {
        const { document, footnotes } = await readDocxParts('Claim.[^src]\n\n[^src]: The source.');

        expect(document).toContain('<w:footnoteReference w:id="1"/>');
        expect(footnotes).toContain('The source.');
    });

    it('indents blockquotes and keeps their text', async () => {
        const { document } = await readDocxParts('> Quoted text');

        expect(document).toContain('Quoted text');
        expect(document).toMatch(/<w:ind w:left="360"\/>/);
    });

    it('draws a horizontal rule as a borderless table with only a top border', async () => {
        const { document } = await readDocxParts('Above\n\n---\n\nBelow');

        expect(countMatches(document, /<w:tbl>/g)).toBe(1);
        expect(document).toMatch(/<w:top w:val="single"/);
        expect(document).toMatch(/<w:bottom w:val="none"/);
    });

    it('gives the last item of a tight list normal spacing so the next paragraph is not cramped', async () => {
        const { document } = await readDocxParts('- a\n- b\n\nAfter');

        expect(countMatches(document, /<w:spacing w:after="60" w:line="300"\/>/g)).toBe(1);
    });

    it('does not embed remote images', async () => {
        const { document, relationships } = await readDocxParts('![Chart](https://example.com/chart.png)');

        expect(document).toContain('[Chart]');
        expect(document).not.toContain('<w:drawing>');
        expect(relationships).not.toContain('media/');
    });

    it('removes characters that are invalid in XML', async () => {
        const { document } = await readDocxParts('Before\u0001After');

        expect(document).toContain('BeforeAfter');
    });

    it('produces a valid document for empty markdown', async () => {
        const { document } = await readDocxParts('');

        expect(document).toContain('<w:body>');
    });
});
