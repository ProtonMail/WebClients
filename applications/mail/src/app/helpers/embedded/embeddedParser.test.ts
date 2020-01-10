import { prepareImages, mutateHTML } from './embeddedParser';
import { Message } from '../../models/message';
import { parseInDiv } from '../dom';

jest.mock('./embeddedFinder', () => ({
    getAttachment: jest.fn((message: Message, src: string) => {
        if (src === 'cid:embedded.jpg') {
            return { Name: 'embedded name' };
        }
    })
}));

jest.mock('./embeddedStoreCids', () => ({
    getMessageCIDs: jest.fn(() => ({ '-9e96b583@protonmail.com': {} }))
}));

jest.mock('./embeddedStoreBlobs', () => ({
    getBlob: jest.fn(() => ({ url: '123-234' }))
}));

describe('embeddedParser', () => {
    describe('prepareImages', () => {
        // Reference: Angular/test/specs/message/services/transformEmbedded.spec.js

        const EMBEDDED_CID = 'cid:embedded.jpg';
        const EMBEDDED_NAME = 'embedded name';
        const INLINE_EMBEDDED_URL = 'data:image/png;base64,iVBORw0KGgoA';
        const DOM = `
            <img proton-src="${EMBEDDED_CID}">
            <img proton-src="/remote.jpg">
            <img proton-src="${INLINE_EMBEDDED_URL}">
        `;

        const setup = (show = true) => {
            const message = { document: parseInDiv(DOM) };
            prepareImages(message, show, false, false);
            return message.document.querySelectorAll('img');
        };

        it('should add data-embedded-img for embedded img', () => {
            const imgs = setup();
            const embeddedImg = imgs[0];
            expect(embeddedImg.getAttribute('class')).toEqual('proton-embedded');
            expect(embeddedImg.getAttribute('data-embedded-img')).toEqual(EMBEDDED_CID);
            expect(embeddedImg.getAttribute('referrerpolicy')).toEqual('no-referrer');
        });

        it('should not add data-embedded-img for remote img', () => {
            const imgs = setup();
            const remoteImg = imgs[1];
            expect(remoteImg.getAttribute('data-embedded-img')).toBeNull();
        });

        it('should add src for inline embedded img', () => {
            const imgs = setup();
            const embeddedImg = imgs[2];
            expect(embeddedImg.getAttribute('class')).toEqual('proton-embedded');
            expect(embeddedImg.getAttribute('data-embedded-img')).toEqual(INLINE_EMBEDDED_URL);
            expect(embeddedImg.getAttribute('referrerpolicy')).toEqual('no-referrer');
        });

        it('should not add data-embedded-img for embedded img if show = false', () => {
            const imgs = setup(false);
            const embeddedImg = imgs[0];
            expect(embeddedImg.getAttribute('class')).toEqual('proton-embedded');
            expect(embeddedImg.getAttribute('data-embedded-img')).toBeNull();
            expect(embeddedImg.getAttribute('alt')).toEqual(EMBEDDED_NAME);
            expect(embeddedImg.getAttribute('referrerpolicy')).toEqual('no-referrer');
        });

        it('should not add data-embedded-img for remote img if show = false', () => {
            const imgs = setup(false);
            const remoteImg = imgs[1];
            expect(remoteImg.getAttribute('data-embedded-img')).toBeNull();
        });

        it('should not add data-embedded-img for inline embedded img if show = false', () => {
            const imgs = setup(false);
            const embeddedImg = imgs[2];
            expect(embeddedImg.getAttribute('class')).toEqual('proton-embedded');
            expect(embeddedImg.getAttribute('data-embedded-img')).toBeNull();
            expect(embeddedImg.getAttribute('alt')).toBeNull();
            expect(embeddedImg.getAttribute('referrerpolicy')).toEqual('no-referrer');
        });
    });

    describe('mutateHTML', () => {
        // Reference: Angular/test/specs/attachments/embeddedParser.spec.js

        const setup = (html: string, direction = 'blob') => {
            const message = { document: parseInDiv(html) };
            mutateHTML(message, direction);
            return message.document;
        };

        it('should parse embedded images and set src', async () => {
            const document = setup(
                '<img class="proton-embedded" data-src="cid:-9e96b583@protonmail.com" alt="embedded.jpg">'
            );
            expect(document.innerHTML).toMatchSnapshot();
        });

        it('should not parse embedded images and set src on proton-src', async () => {
            const document = setup(
                '<img class="proton-embedded" proton-src="cid:-9e96b583@protonmail.com" alt="embedded.jpg" >'
            );
            expect(document.innerHTML).toMatchSnapshot();
        });

        it('should always transform proton-src to src on direction cid', async () => {
            const document = setup(
                '<img class="proton-embedded" proton-src="cid:-9e96b583@protonmail.com" alt="embedded.jpg">',
                'cid'
            );
            expect(document.innerHTML).toMatchSnapshot();
        });

        it('should remove data-src when they are escaped with proton', async () => {
            const document = setup(
                '<img class="proton-embedded" proton-src="cid:-9e96b583@protonmail.com" data-src="cid:-9e96b583@protonmail.com" alt="embedded.jpg">'
            );
            expect(document.innerHTML).toMatchSnapshot();
        });
    });
});
