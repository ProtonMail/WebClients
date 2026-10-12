import { renderVegaSpecToPng } from './renderVegaSpecToSvg';

const mockEmbed = jest.fn();
jest.mock('vega-embed', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockEmbed(...args),
}));
jest.mock('vega-interpreter', () => ({ expressionInterpreter: {} }));

// A PNG header for a 1300 × 760 image: signature, then IHDR with big-endian width and height.
function pngDataUrl(width: number, height: number): string {
    const bytes = new Uint8Array(33);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
    const view = new DataView(bytes.buffer);
    view.setUint32(16, width);
    view.setUint32(20, height);
    return `data:image/png;base64,${btoa(String.fromCharCode(...bytes))}`;
}

describe('renderVegaSpecToPng', () => {
    it('returns the PNG bytes and its CSS-pixel size measured from the image at the given scale', async () => {
        const toImageURL = jest.fn().mockResolvedValue(pngDataUrl(1300, 760));
        const finalize = jest.fn();
        mockEmbed.mockResolvedValue({ view: { run: jest.fn(), resize: jest.fn(), toImageURL, finalize } });

        const png = await renderVegaSpecToPng('{"mark":"bar","data":{"values":[{"a":1}]}}');

        expect(toImageURL).toHaveBeenCalledWith('png', 2);
        expect(png.width).toBe(650);
        expect(png.height).toBe(380);
        expect(Array.from(png.data.slice(1, 4))).toEqual([0x50, 0x4e, 0x47]);
        expect(finalize).toHaveBeenCalled();
    });

    it('rejects a spec the sanitizer refuses, without rendering', async () => {
        mockEmbed.mockReset();

        await expect(
            renderVegaSpecToPng('{"mark":"bar","data":{"url":"https://example.com/x.json"}}')
        ).rejects.toThrow();
        expect(mockEmbed).not.toHaveBeenCalled();
    });
});
