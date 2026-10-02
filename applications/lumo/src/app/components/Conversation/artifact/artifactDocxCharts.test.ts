import JSZip from 'jszip';

import { markdownToDocxBlob } from '../../../util/docx/markdownToDocx';
import { renderVegaSpecToPng } from '../../LumoMarkdown/vega/renderVegaSpecToSvg';
import { prepareDocxCharts } from './artifactDocxCharts';

// jsdom has no canvas, so the PNG renderer itself is mocked; renderVegaSpecToSvg.test covers it.
jest.mock('../../LumoMarkdown/vega/renderVegaSpecToSvg', () => ({
    renderVegaSpecToPng: jest.fn(),
}));

const ONE_PIXEL_PNG = Uint8Array.from(
    atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
    (char) => {
        return char.charCodeAt(0);
    }
);
const SPEC = '{"title":{"text":"Sales","subtitle":"Q2 [peak]"},"data":{"values":[{"q":"Q1","v":3}]},"mark":"bar"}';
const CHART = `\`\`\`vega-lite\n${SPEC}\n\`\`\``;

describe('prepareDocxCharts (D12)', () => {
    beforeEach(() => {
        jest.mocked(renderVegaSpecToPng).mockReset();
        jest.mocked(renderVegaSpecToPng).mockResolvedValue({ data: ONE_PIXEL_PNG, width: 640, height: 360 });
    });

    it('replaces each chart fence with an image keyed into localImages, with the title as alt text', async () => {
        const { markdown, localImages } = await prepareDocxCharts(`# Report\n\n${CHART}\n\nAfter\n\n${CHART}\n`);

        const keys = Array.from(localImages.keys());
        expect(keys).toHaveLength(2);
        expect(markdown).toBe(
            `# Report\n\n![Sales — Q2 \\[peak\\]](${keys[0]})\n\nAfter\n\n![Sales — Q2 \\[peak\\]](${keys[1]})\n`
        );
        expect(localImages.get(keys[0]!)).toEqual({ data: ONE_PIXEL_PNG, width: 640, height: 360 });
        expect(renderVegaSpecToPng).toHaveBeenCalledWith(SPEC);
    });

    it('uses a fresh random key per export, so a model-written image link cannot match one', async () => {
        const first = Array.from((await prepareDocxCharts(CHART)).localImages.keys())[0];
        const second = Array.from((await prepareDocxCharts(CHART)).localImages.keys())[0];

        expect(first).toMatch(/^lumo-chart-[0-9a-f]{16}-0$/);
        expect(first).not.toBe(second);
    });

    it('falls back to the title and data table when a chart fails to render', async () => {
        jest.mocked(renderVegaSpecToPng).mockRejectedValueOnce(new Error('rejected spec'));

        const { markdown, localImages } = await prepareDocxCharts(CHART);

        expect(localImages.size).toBe(0);
        expect(markdown).toBe('**Chart: Sales**\n\n*Q2 \\[peak\\]*\n\n| q | v |\n| --- | --- |\n| Q1 | 3 |');
    });

    it('leaves documents without explicit chart fences untouched and renders nothing', async () => {
        const markdown = '```json\n{"mark":"bar"}\n```\n\nText';

        expect(await prepareDocxCharts(markdown)).toEqual({ markdown, localImages: new Map() });
        expect(renderVegaSpecToPng).not.toHaveBeenCalled();
    });

    it('embeds the chart as a picture in the Word file', async () => {
        const { markdown, localImages } = await prepareDocxCharts(`${CHART}\n\n![x](lumo-chart-guess-0)`);
        const blob = await markdownToDocxBlob(markdown, { title: 'Report', localImages });
        const zip = await JSZip.loadAsync(await new Response(blob).arrayBuffer());
        const document = (await zip.file('word/document.xml')?.async('string')) ?? '';

        expect(zip.file(/^word\/media\/.+\.png$/)).toHaveLength(1);
        expect(document.match(/<w:drawing>/g)).toHaveLength(1);
        expect(document).toContain('descr="Sales — Q2 [peak]"');
        expect(document).toContain('[x]');
        expect(document).not.toContain('$schema');
    });
});
