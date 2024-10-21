import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import type { MessageEmbeddedImage, MessageImage, PartialMessageState } from '../../store/messages/messagesTypes';
import { createDocument } from '../test/message';
import {
    createBlob,
    createEmbeddedImageFromUpload,
    embeddableTypes,
    findCIDsInContent,
    findEmbedded,
    generateCid,
    insertActualEmbeddedImages,
    insertBlobImages,
    isEmbeddable,
    markEmbeddedAsLoaded,
    markEmbeddedImagesAsLoaded,
    matchSameCidOrLoc,
    readContentIDandLocation,
    removeEmbeddedHTML,
    replaceEmbeddedAttachments,
    replaceEmbeddedUrls,
    setEmbeddedAttr,
    trimQuotes,
} from './messageEmbeddeds';

const contentID = 'my-content-id';
const contentLocation = 'my-content-location';
const attachmentID = 'attachmentID';

const attachment = {
    Headers: {
        'content-id': contentID,
        'content-location': contentLocation,
    },
    ID: attachmentID,
} as Attachment;

describe('messageEmbeddeds', () => {
    describe('trimQuotes', () => {
        it('should trim quotes', () => {
            const string1 = `'string'`;
            const string2 = `"string"`;
            const string3 = `<string>`;

            const expected = 'string';
            expect(trimQuotes(string1)).toEqual(expected);
            expect(trimQuotes(string2)).toEqual(expected);
            expect(trimQuotes(string3)).toEqual(expected);
        });
    });

    describe('isEmbeddable', () => {
        it('should be an embeddable file', () => {
            const types = embeddableTypes;

            types.forEach((type) => {
                expect(isEmbeddable(type)).toBeTruthy();
            });
        });

        it('should not be an embeddable file', () => {
            const types = ['something', 'application/json', 'image/webp'];

            types.forEach((type) => {
                expect(isEmbeddable(type)).toBeFalsy();
            });
        });
    });

    describe('readContentIDandLocation', () => {
        it('should read attachment content id and content location headers', () => {
            const { cid, cloc } = readContentIDandLocation(attachment);

            expect(cid).toEqual(contentID);
            expect(cloc).toEqual(contentLocation);
        });

        it('should read content id and content location headers with line breaks', () => {
            const contentID = `my-content
-id`;
            const contentLocation = `my
-content-location`;

            const headers = {
                'content-id': contentID,
                'content-location': contentLocation,
            };

            const { cid, cloc } = readContentIDandLocation({ Headers: headers });

            expect(cid).toEqual('my-content-id');
            expect(cloc).toEqual('my-content-location');
        });
    });

    describe('matchSameCidOrLoc', () => {
        it('should match the image with cid', () => {
            const image = {
                cid: contentID,
            } as MessageEmbeddedImage;

            expect(matchSameCidOrLoc(image, contentID, '')).toBeTruthy();
        });

        it('should match the image with cloc', () => {
            const image = {
                cloc: contentLocation,
            } as MessageEmbeddedImage;

            expect(matchSameCidOrLoc(image, '', contentLocation)).toBeTruthy();
        });

        it('should not match the image with cloc or cid', () => {
            const image = {
                cid: 'something',
                cloc: 'something else',
            } as MessageEmbeddedImage;

            expect(matchSameCidOrLoc(image, contentID, contentLocation)).toBeFalsy();
        });
    });

    describe('generateCid', () => {
        it('should generate cid', () => {
            const input = 'something';
            const email = 'test@pm.me';

            expect(generateCid(input, email)).toMatch(/([0-9]|[a-z]){8}@pm\.me/);
        });
    });

    describe('setEmbeddedAttr', () => {
        it('should set element cid', () => {
            const el = document.createElement('img');

            setEmbeddedAttr(contentID, contentLocation, el);

            const expectedAttr = `cid:${contentID}`;
            expect(el.getAttribute('data-embedded-img')).toEqual(expectedAttr);
        });

        it('should set element cloc', () => {
            const el = document.createElement('img');

            setEmbeddedAttr('', contentLocation, el);

            const expectedAttr = `cloc:${contentLocation}`;
            expect(el.getAttribute('data-embedded-img')).toEqual(expectedAttr);
        });

        it('should not set element attribute', () => {
            const el = document.createElement('img');

            setEmbeddedAttr('', '', el);

            expect(el.getAttribute('data-embedded-img')).toBeNull();
        });
    });

    describe('createBlob', () => {
        beforeEach(() => {
            global.URL.createObjectURL = jest.fn(() => 'url');
        });

        it('should create a blob', () => {
            const data = stringToUint8Array('data');
            const attachment = { MIMEType: 'image/png' } as Attachment;

            const blob = createBlob(attachment, data);

            expect(blob).toEqual('url');
        });
    });

    describe('createEmbeddedImageFromUpload', () => {
        const expectedImage = {
            type: 'embedded',
            cid: contentID,
            cloc: contentLocation,
            tracker: undefined,
            attachment,
            status: 'loaded',
        } as MessageEmbeddedImage;

        // Ignore generated id for testing
        const { id, ...embeddedImage } = createEmbeddedImageFromUpload(attachment);

        expect(embeddedImage).toEqual(expectedImage);
    });

    describe('finEmbedded', () => {
        it.each`
            attribute              | value
            ${'src'}               | ${`${contentID}`}
            ${'src'}               | ${`cid:${contentID}`}
            ${'data-embedded-img'} | ${`${contentID}`}
            ${'data-embedded-img'} | ${`cid:${contentID}`}
            ${'data-src'}          | ${`cid:${contentID}`}
            ${'proton-src'}        | ${`cid:${contentID}`}
        `('should find cid image', ({ attribute, value }) => {
            const string = `<div>
<img src="random">
<img ${attribute}="${value}"/>
<span>something</span>
</div>`;
            const document = createDocument(string);

            const expectedImg = window.document.createElement('img');
            expectedImg.setAttribute(attribute, value);

            expect(findEmbedded(contentID, contentLocation, document)).toEqual([expectedImg]);
        });

        it('should find cloc images', () => {
            const string = `<div>
<img src="random">
<img proton-src="${contentLocation}"/>
<span>something</span>
</div>`;
            const document = createDocument(string);

            const expectedImg = window.document.createElement('img');
            expectedImg.setAttribute('proton-src', contentLocation);

            expect(findEmbedded('', contentLocation, document)).toEqual([expectedImg]);
        });

        it('should not find images', () => {
            const string = `<div>
<img src="random">
<span>something</span>
</div>`;
            const document = createDocument(string);

            expect(findEmbedded(contentID, contentLocation, document)).toEqual([]);
        });
    });

    describe('findCIDsInContent', () => {
        it('should find a cid in content', () => {
            const string = `<div>
<img src="random" data-embedded-img="${contentID}">
<span>something</span>
</div>`;

            expect(findCIDsInContent(string)).toBeTruthy();
        });

        it('should not a cid in content', () => {
            const string = `<div>
<img src="random">
<span>something</span>
</div>`;

            expect(findCIDsInContent(string)).toBeTruthy();
        });
    });

    describe('insertActualEmbeddedImages', () => {
        it('should insert cid image', function () {
            const string = `<div>
<img src="random" data-embedded-img="cid:${contentID}">
<span>something</span>
</div>`;
            const document = createDocument(string);

            insertActualEmbeddedImages(document);

            expect(document.querySelector('img')?.getAttribute('src')).toEqual(`cid:${contentID}`);

            const imageWithDataAttribute = document.querySelector('img[data-embedded-img]');
            expect(imageWithDataAttribute).toBeNull();
        });

        it('should insert cloc image', function () {
            const string = `<div>
<img src="random" data-embedded-img="cloc:${contentLocation}">
<span>something</span>
</div>`;
            const document = createDocument(string);

            insertActualEmbeddedImages(document);

            expect(document.querySelector('img')?.getAttribute('src')).toEqual(`${contentLocation}`);

            const imageWithDataAttribute = document.querySelector('img[data-embedded-img]');
            expect(imageWithDataAttribute).toBeNull();
        });
    });

    describe('replaceEmbeddedAttachments', () => {
        it('should replace embedded attachments', () => {
            const message = {
                messageImages: {
                    hasEmbeddedImages: true,
                    images: [{ cid: contentID, type: 'embedded' } as MessageEmbeddedImage] as MessageImage[],
                },
            } as PartialMessageState;

            const res = replaceEmbeddedAttachments(message, [attachment]);

            const expected = {
                attachment: {
                    Headers: {
                        'content-id': contentID,
                        'content-location': contentLocation,
                    },
                    ID: attachmentID,
                } as Attachment,
                cid: contentID,
                type: 'embedded',
            } as MessageEmbeddedImage;

            expect(res.images).toEqual([expected]);
        });
    });

    describe('remoteEmbeddedHTML', () => {
        it('should remove embedded attachment from the document', () => {
            const string = `<div>
<img src="random" data-embedded-img="${contentID}">
<span>something</span>
</div>`;
            const document = createDocument(string);

            removeEmbeddedHTML(document, attachment);

            expect(document.querySelector('img')).toBeNull();
        });
    });

    describe('insertBlobImages', () => {
        it('should insert blob image', () => {
            const url = 'https://image.com/img.png';
            const string = `<div>
<img proton-src="${url}" data-embedded-img="${contentID}">
<span>something</span>
</div>`;
            const document = createDocument(string);

            const embeddedImages = [
                { cid: contentID, type: 'embedded', url } as MessageEmbeddedImage,
            ] as MessageEmbeddedImage[];

            insertBlobImages(document, embeddedImages);

            const image = document.querySelector('img');
            expect(image?.getAttribute('proton-src')).toBeNull();
            expect(image?.getAttribute('src')).toEqual(url);
        });
    });

    describe('markEmbeddedImagesAsLoaded', () => {
        it('should mark embedded images as loaded', () => {
            const blobURL = 'blobURL';
            const embeddedImages = [
                {
                    cid: contentID,
                    type: 'embedded',
                    attachment: { ID: attachmentID } as Attachment,
                } as MessageEmbeddedImage,
            ] as MessageEmbeddedImage[];

            const loadResults: { attachment: Attachment; blob: string }[] = [{ attachment, blob: blobURL }];

            const res = markEmbeddedImagesAsLoaded(embeddedImages, loadResults);

            const expected = [
                {
                    attachment: { ID: attachmentID },
                    cid: contentID,
                    status: 'loaded',
                    type: 'embedded',
                    url: blobURL,
                },
            ] as MessageEmbeddedImage[];

            expect(res).toEqual(expected);
        });
    });

    describe('markEmbeddedAsLoaded', () => {
        it('should mark embedded images as loaded', () => {
            const blobURL = 'blobURL';
            const embeddedImages = [
                {
                    cid: contentID,
                    type: 'embedded',
                    attachment: { ID: attachmentID } as Attachment,
                } as MessageEmbeddedImage,
            ] as MessageEmbeddedImage[];

            const loadResults: { attachment: Attachment; blob: string }[] = [{ attachment, blob: blobURL }];

            const res = markEmbeddedAsLoaded(embeddedImages, loadResults);

            const expected = [
                {
                    attachment: { ID: attachmentID },
                    cid: contentID,
                    status: 'loaded',
                    type: 'embedded',
                    url: undefined,
                },
            ] as MessageEmbeddedImage[];

            expect(res).toEqual(expected);
        });
    });

    describe('replaceEmbeddedUrls', () => {
        it('should replace embedded urls', () => {
            const blobURL = 'blobURL';
            const embeddedImages = [
                {
                    cid: contentID,
                    type: 'embedded',
                    attachment: { ID: attachmentID } as Attachment,
                } as MessageEmbeddedImage,
            ] as MessageEmbeddedImage[];

            const loadResults: { attachment: Attachment; blob: string }[] = [{ attachment, blob: blobURL }];

            const res = replaceEmbeddedUrls(embeddedImages, loadResults);

            const expected = [
                {
                    attachment: { ID: attachmentID },
                    cid: contentID,
                    type: 'embedded',
                    url: blobURL,
                },
            ] as MessageEmbeddedImage[];

            expect(res).toEqual(expected);
        });
    });
});
