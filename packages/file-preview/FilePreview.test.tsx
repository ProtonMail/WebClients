import { render } from '@testing-library/react';

import { FilePreviewContent } from './FilePreview';

const PDF = '%PDF-1.4\n';

describe('FilePreviewContent', () => {
    beforeEach(() => {
        URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
        URL.revokeObjectURL = vi.fn();
    });

    it.each([
        ['text/pdf', 'invoice.pdf', PDF, 'pdf'],
        ['application/octet-stream', 'SCAN.PDF', PDF, 'pdf'],
        ['application/pdf', 'file.bin', PDF, 'pdf'],
        ['application/pdf', 'file.bin', 'hello', 'pdf'],
        ['text/pdf', 'invoice.txt', PDF, 'text'],
        ['text/plain', 'notes.pdf', 'hello', 'text'],
        ['text/plain', 'invoice.pdf.txt', PDF, 'text'],
        ['text/plain', 'notes_pdf', PDF, 'text'],
        ['text/plain', 'notes.txt', 'hello', 'text'],
    ])('opens %s named %s with %j in the %s viewer', (mimeType, fileName, contents, expected) => {
        const { container } = render(
            <FilePreviewContent
                isLoading={false}
                mimeType={mimeType}
                fileName={fileName}
                contents={[new TextEncoder().encode(contents)]}
            />
        );

        expect(!!container.querySelector('object[type="application/pdf"]')).toBe(expected === 'pdf');
        expect(!!container.querySelector('.file-preview-text')).toBe(expected === 'text');
    });
});
