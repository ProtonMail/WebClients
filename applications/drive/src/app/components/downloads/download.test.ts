import { initDownload } from './download';
import { streamToBuffer } from '../../utils/stream';
import { ReadableStream } from 'web-streams-polyfill';

describe('initDownload', () => {
    it('should download data from preloaded data buffer if provided', async () => {
        const sendData = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]), new Uint8Array([7, 8, 9])];

        const resultStream = await new Promise<ReadableStream<Uint8Array>>((resolve) => {
            const { downloadControls } = initDownload({
                async onStart(stream) {
                    resolve(stream);
                    return sendData;
                }
            });
            downloadControls.start(jest.fn());
        });

        const buffer = await streamToBuffer(resultStream);
        expect(buffer).toEqual(sendData);
    });
});
