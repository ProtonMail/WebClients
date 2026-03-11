import { FileLoadError } from '../thumbnailError';
import { SVGHandler } from './svgHandler';

if (!global.Blob.prototype.text) {
    global.Blob.prototype.text = async function (this: Blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result as string);
            };
            reader.onerror = () => {
                reject(reader.error);
            };
            reader.readAsText(this);
        });
    };
}

describe('SVGHandler', () => {
    let handler: SVGHandler;

    beforeEach(() => {
        handler = new SVGHandler();
    });

    describe('canHandle', () => {
        test('Returns true for SVG MIME type', () => {
            expect(handler.canHandle('image/svg+xml')).toBe(true);
        });

        test('Returns false for non-SVG MIME types', () => {
            expect(handler.canHandle('image/jpeg')).toBe(false);
            expect(handler.canHandle('image/png')).toBe(false);
            expect(handler.canHandle('video/mp4')).toBe(false);
            expect(handler.canHandle('application/pdf')).toBe(false);
        });
    });

    describe('metadata', () => {
        test('Handler name is SVGHandler', () => {
            expect(handler.handlerName).toBe('SVGHandler');
        });
    });

    describe('setSvgSize', () => {
        const testSize = 512;

        const callSetSvgSize = async (svgContent: string, size: number = testSize): Promise<string> => {
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const resultBlob = await (handler as any).setSvgSize(blob, size);
            return await resultBlob.text();
        };

        describe('SVG with existing width and height attributes', () => {
            test('Replaces existing width and height with double quotes', async () => {
                const svg = '<svg width="100" height="200"><circle r="50"/></svg>';
                const result = await callSetSvgSize(svg);
                expect(result).toBe('<svg width="512px" height="512px"><circle r="50"/></svg>');
            });

            test('Replaces existing width and height with single quotes', async () => {
                const svg = "<svg width='100' height='200'><circle r='50'/></svg>";
                const result = await callSetSvgSize(svg);
                expect(result).toBe('<svg width="512px" height="512px"><circle r=\'50\'/></svg>');
            });

            test('Replaces width and height with various spacing', async () => {
                const svg = '<svg width  =  "100"  height  =  "200"><circle r="50"/></svg>';
                const result = await callSetSvgSize(svg);
                expect(result).toBe('<svg width="512px"  height="512px"><circle r="50"/></svg>');
            });

            test('Handles width and height at start of attributes', async () => {
                const svg = '<svg width="100" height="200" xmlns="http://www.w3.org/2000/svg"></svg>';
                const result = await callSetSvgSize(svg);
                expect(result).toContain('width="512px"');
                expect(result).toContain('height="512px"');
                expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
            });
        });

        describe('SVG without width and height attributes', () => {
            test('Adds width and height when missing', async () => {
                const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="50"/></svg>';
                const result = await callSetSvgSize(svg);
                expect(result).toContain('width="512px"');
                expect(result).toContain('height="512px"');
                expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
            });

            test('Adds width and height to minimal SVG', async () => {
                const svg = '<svg><circle r="50"/></svg>';
                const result = await callSetSvgSize(svg);
                expect(result).toBe('<svg width="512px" height="512px"><circle r="50"/></svg>');
            });
        });

        describe('Edge cases: attributes ending with width/height', () => {
            test('Does not modify data-width or data-height attributes', async () => {
                const svg = '<svg data-width="999" data-height="999" width="100" height="200"></svg>';
                const result = await callSetSvgSize(svg);
                expect(result).toContain('data-width="999"');
                expect(result).toContain('data-height="999"');
                expect(result).toContain('width="512px"');
                expect(result).toContain('height="512px"');
            });

            test('Does not modify custom attributes ending with width/height', async () => {
                const svg = '<svg stroke-width="5" line-height="1.5"></svg>';
                const result = await callSetSvgSize(svg);
                expect(result).toContain('stroke-width="5"');
                expect(result).toContain('line-height="1.5"');
                expect(result).toContain('width="512px"');
                expect(result).toContain('height="512px"');
            });

            test('Does not modify attribute values containing width or height words', async () => {
                const svg =
                    '<svg title="width and height info" data-info="The width is 100" width="50" height="50"></svg>';
                const result = await callSetSvgSize(svg);
                expect(result).toContain('title="width and height info"');
                expect(result).toContain('data-info="The width is 100"');
                expect(result).toContain('width="512px"');
                expect(result).toContain('height="512px"');
            });
        });

        describe('Mixed scenarios', () => {
            test('Handles SVG with viewBox and preserveAspectRatio', async () => {
                const svg =
                    '<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" width="50" height="50"></svg>';
                const result = await callSetSvgSize(svg);
                expect(result).toContain('viewBox="0 0 100 100"');
                expect(result).toContain('preserveAspectRatio="xMidYMid meet"');
                expect(result).toContain('width="512px"');
                expect(result).toContain('height="512px"');
            });

            test('Handles SVG with only width attribute', async () => {
                const svg = '<svg width="100" xmlns="http://www.w3.org/2000/svg"></svg>';
                const result = await callSetSvgSize(svg);
                expect(result).toContain('width="512px"');
                expect(result).toContain('height="512px"');
            });

            test('Handles SVG with only height attribute', async () => {
                const svg = '<svg height="200" xmlns="http://www.w3.org/2000/svg"></svg>';
                const result = await callSetSvgSize(svg);
                expect(result).toContain('width="512px"');
                expect(result).toContain('height="512px"');
            });

            test('Handles uppercase SVG tag', async () => {
                const svg = '<SVG width="100" height="200"></SVG>';
                const result = await callSetSvgSize(svg);
                expect(result).toContain('width="512px"');
                expect(result).toContain('height="512px"');
            });

            test('Uses custom size value', async () => {
                const svg = '<svg width="100" height="200"></svg>';
                const result = await callSetSvgSize(svg, 256);
                expect(result).toContain('width="256px"');
                expect(result).toContain('height="256px"');
            });
        });

        describe('Complex SVG structures', () => {
            test('Handles multi-line SVG', async () => {
                const svg = `<svg
                    width="100"
                    height="200"
                    xmlns="http://www.w3.org/2000/svg">
                    <circle r="50"/>
                </svg>`;
                const result = await callSetSvgSize(svg);
                expect(result).toContain('width="512px"');
                expect(result).toContain('height="512px"');
            });

            test('Preserves SVG content after opening tag', async () => {
                const svg = '<svg width="100" height="200"><path d="M10 10"/><text>Hello</text></svg>';
                const result = await callSetSvgSize(svg);
                expect(result).toContain('<path d="M10 10"/>');
                expect(result).toContain('<text>Hello</text>');
                expect(result).toContain('width="512px"');
                expect(result).toContain('height="512px"');
            });
        });

        describe('Error cases', () => {
            test('Throws FileLoadError when no SVG tag found', async () => {
                const notSvg = '<div>Not an SVG</div>';
                const blob = new Blob([notSvg], { type: 'image/svg+xml' });

                await expect((handler as any).setSvgSize(blob, testSize)).rejects.toThrow(FileLoadError);
                await expect((handler as any).setSvgSize(blob, testSize)).rejects.toThrow('No SVG opening tag found');
            });

            test('Throws FileLoadError for empty content', async () => {
                const empty = '';
                const blob = new Blob([empty], { type: 'image/svg+xml' });

                await expect((handler as any).setSvgSize(blob, testSize)).rejects.toThrow(FileLoadError);
            });
        });
    });
});
