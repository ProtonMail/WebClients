import { render } from '@testing-library/react';

import ImagePreview from './ImagePreview';

const MALICIOUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.domain)</script><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>`;

// jsdom's Blob does not implement `.text()`, only FileReader can read its contents.
const readBlobAsText = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(blob);
    });

describe('ImagePreview', () => {
    let createObjectURLSpy: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        createObjectURLSpy = jest.fn().mockReturnValue('blob:mock-url');
        URL.createObjectURL = createObjectURLSpy;
        URL.revokeObjectURL = jest.fn();
    });

    const renderAndReadBlob = async (mimeType: string, svg = MALICIOUS_SVG) => {
        render(<ImagePreview isLoading={false} mimeType={mimeType} contents={[new TextEncoder().encode(svg)]} />);
        const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
        return readBlobAsText(blob);
    };

    it.each(['image/svg+xml', 'image/svg', 'image/SVG+XML', 'image/svg+xml; charset=utf-8', 'application/svg+xml'])(
        'strips scripts from the blob for mime type %s',
        async (mimeType) => {
            const content = await renderAndReadBlob(mimeType);

            expect(content).not.toContain('<script');
            expect(content).not.toContain('javascript:');
        }
    );

    it('keeps non-svg contents untouched', async () => {
        const content = await renderAndReadBlob('image/png', '<script>alert(1)</script>');

        expect(content).toContain('<script>alert(1)</script>');
    });
});
