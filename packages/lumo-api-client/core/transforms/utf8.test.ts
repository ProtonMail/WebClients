import { makeUtf8DecodingTransformStream } from './utf8';

it('decodes multibyte text split across replay chunks', async () => {
    const bytes = new TextEncoder().encode('café 🐱 中文');
    const source = new ReadableStream({
        start(controller) {
            for (const byte of bytes) {
                controller.enqueue(new Uint8Array([byte]));
            }
            controller.close();
        },
    });
    const reader = source.pipeThrough(makeUtf8DecodingTransformStream()).getReader();
    let result = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        result += value;
    }
    expect(result).toBe('café 🐱 中文');
});
