import type { ToolFile } from '@proton/lumo-api-client/core/client-tools';

import { createToolFileProcessor } from './toolFileProcessing';

const source = (name: string, binary = false): ToolFile => ({
    id: 'file',
    path: `/local/${name}`,
    name,
    mimeType: 'application/octet-stream',
    binary,
    data: new TextEncoder().encode('file bytes'),
});

beforeEach(() => {
    jest.clearAllMocks();
});

test.each([
    ['report.pdf', 'application/pdf'],
    ['data.csv', 'text/csv'],
    ['book.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['document.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
])('uses the upload processor for %s with the existing MIME configuration', async (name, mimeType) => {
    const metadata = { rowCount: { original: 100, processed: 50 }, truncated: true };
    const processFile = jest.fn(async () => ({
        id: 'processed',
        type: 'text' as const,
        content: 'converted content',
        metadata,
    }));
    const file = source(name);
    const result = await createToolFileProcessor(true, async () => ({ processFile }))(file);
    const [input, options] = processFile.mock.calls[0] as unknown as [File, { fileData: ArrayBuffer }];
    expect(input.name).toBe(name);
    expect(input.type).toBe(mimeType);
    expect(options.fileData).toBe(file.data.buffer);
    expect(JSON.parse(result.content)).toEqual({
        path: file.path,
        mime_type: mimeType,
        content: { encoding: 'utf-8', content: 'converted content' },
        metadata,
    });
    expect(result.content).not.toContain('file bytes');
});

test('uses upload image conversion, including HEIC, and sends the processed thumbnail', async () => {
    const hdImage = Uint8Array.from(
        atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='),
        (char) => char.charCodeAt(0)
    );
    const processFile = jest.fn(async () => ({
        id: 'processed',
        type: 'image' as const,
        hdImage,
        originalSize: 100,
        hdImageSize: hdImage.length,
    }));
    const result = await createToolFileProcessor(true, async () => ({ processFile }))(source('photo.heic', true));
    expect((processFile.mock.calls[0] as unknown as [File])[0].type).toBe('image/heic');
    expect(result.images).toEqual([
        expect.objectContaining({
            image_id: 'file',
            mime_type: 'image/png',
            data: hdImage.toBase64(),
        }),
    ]);
});

test('rejects unsupported binaries and blocked file types without initializing the worker', async () => {
    const load = jest.fn();
    for (const file of [source('file.unknown', true), source('design.ai')]) {
        expect((await createToolFileProcessor(true, load)(file)).is_error).toBe(true);
    }
    expect(load).not.toHaveBeenCalled();
});

test('preserves reads of unknown text files and propagates conversion errors', async () => {
    const processFile = jest.fn(async () => ({
        id: 'processed',
        type: 'error' as const,
        message: 'No extractable PDF text',
    }));
    const result = await createToolFileProcessor(true, async () => ({ processFile }))(source('README'));
    expect((processFile.mock.calls[0] as unknown as [File])[0].type).toBe('text/plain');
    expect(result.is_error).toBe(true);
    expect(result.content).toContain('No extractable PDF text');
});
