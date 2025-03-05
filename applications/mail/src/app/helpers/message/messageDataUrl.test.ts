import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { dataUrlToFile, replaceDataUrl } from 'proton-mail/helpers/message/messageDataUrl';
import { createDocument } from 'proton-mail/helpers/test/message';

jest.mock('@proton/shared/lib/helpers/encoding', () => ({
    base64StringToUint8Array: jest.fn((str) => new Uint8Array(Buffer.from(str, 'base64'))),
}));

describe('messageDataUrl', () => {
    describe('dataUrlToFile', () => {
        it('should return a file', () => {
            const dataUrl = 'data:image/png;base64,aGVsbG8='; // "hello" in base64
            const fileName = 'image.png';

            const file = dataUrlToFile(fileName, dataUrl);

            expect(file).toBeInstanceOf(File);
            expect(file.name).toEqual(fileName);
            expect(file.type).toBe('image/png');
            expect(base64StringToUint8Array).toHaveBeenCalledWith('aGVsbG8=');
            expect(file.size).toBe(5); // "hello" is 5 bytes
        });
    });

    describe('replaceDataUrl', () => {
        test('it should return an empty array when message has no document', () => {
            const message = { messageDocument: null };
            expect(replaceDataUrl(message as any)).toEqual([]);
        });

        test('it should return an empty array when document has no image', () => {
            const message = {
                messageDocument: {
                    document: createDocument('Hello'),
                },
            };
            expect(replaceDataUrl(message as any)).toEqual([]);
        });

        test('it should ignore non data uri images', () => {
            const htmlContent = `<div>
<img src='https://images/image.png' alt="" />
</div>`;

            const message = {
                messageDocument: {
                    document: createDocument(htmlContent),
                },
            };
            expect(replaceDataUrl(message as any)).toEqual([]);
        });

        test('it should an array of images that have been replaced', () => {
            const htmlContent = `<div>
<img src='data:image/png;base64,image1' alt=""  />
<img src='data:image/png;base64,image2' alt=""  />
</div>`;
            const message = {
                messageDocument: {
                    document: createDocument(htmlContent),
                },
            };
            expect(replaceDataUrl(message as any)).toHaveLength(2);
        });

        test('it should an array of images that have been replaced, ignoring duplicates', () => {
            const htmlContent = `<div>
<img src='data:image/png;base64,image1' alt=""  />
<img src='data:image/png;base64,image2' alt=""  />
<img src='data:image/png;base64,image2' alt=""  />
</div>`;
            const message = {
                messageDocument: {
                    document: createDocument(htmlContent),
                },
            };
            expect(replaceDataUrl(message as any)).toHaveLength(2);
        });
    });
});
