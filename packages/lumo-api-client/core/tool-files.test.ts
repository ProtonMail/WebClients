import { processToolFileResult } from './tool-files';

const file = {
    id: 'file',
    name: 'data.csv',
    path: '/data.csv',
    mimeType: 'text/csv',
    binary: false,
    data: new TextEncoder().encode('name,value\nalice,1\n'),
};

test('conversion failures become per-tool errors', async () => {
    const failed = await processToolFileResult({ content: '', files: [{ file }] }, async () => {
        throw new Error('PDF extraction failed');
    });
    expect(failed).toEqual({ content: '{"error":"PDF extraction failed"}', is_error: true });
});

test('processes file attachments and preserves accompanying text and errors', async () => {
    const text = JSON.stringify({
        content: [{ type: 'text', text: 'Screenshot captured' }],
        structuredContent: { title: 'Page title' },
        isError: true,
    });
    const screenshot = { ...file, mimeType: 'image/png', name: 'screenshot', binary: true };
    const processor = jest.fn(async (source) => ({
        content: 'Image read',
        images: [
            {
                image_id: source.id,
                path: source.path,
                mime_type: 'image/png',
                data: 'processed screenshot',
            },
        ],
    }));
    const result = await processToolFileResult(
        {
            content: text,
            is_error: true,
            files: [{ file: screenshot }, { file: { ...screenshot, id: 'second' } }],
        },
        processor
    );
    expect(processor).toHaveBeenCalledTimes(2);
    expect(result.content).toBe(text + '\nImage read\nImage read');
    expect(result.images!).toHaveLength(2);
    expect(result.images![1].image_id).toBe('second');
    expect(result.is_error).toBe(true);
});

test('retains tool text when file processing is unavailable, without sending bytes as prose', async () => {
    const result = await processToolFileResult({
        content: 'Screenshot explanation',
        files: [{ file }],
    });
    expect(result.content).toContain('Screenshot explanation');
    expect(result.content).not.toContain('alice');
    expect(result.images).toBeUndefined();
    expect(result.is_error).toBe(true);
});

test('leaves tool text untouched even when it resembles a native envelope', async () => {
    const result = {
        content: JSON.stringify({ type: 'lumo_tool_result', text: 'processed', images: [], isError: false }),
    };
    const processor = jest.fn();
    expect((await processToolFileResult(result, processor)).content).toBe(result.content);
    expect(processor).not.toHaveBeenCalled();
});
