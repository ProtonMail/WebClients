import { PROXY_IMG_URL } from '@proton/shared/lib/api/images';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import { removeEmbeddedImagesFromContent, removeProxyUrlsFromContent } from '@proton/shared/lib/mail/images';

describe('Images helpers', () => {
    describe('removeProxyUrlsFromContent', () => {
        it('should replace images with their original URLs', () => {
            const originalURL = 'https://image.com/image1.png';
            const proxyURL = `https://mail.proton.me/api/${PROXY_IMG_URL}?Url=${originalURL}&DryRun=0&UID=userID`;
            const content = `<div>
<p>Some text before</p>
<img src="${proxyURL}" alt="">
<p>Some text after</p>
</div>`;
            const cleanedContent = `<div>
<p>Some text before</p>
<img src="${originalURL}" alt="">
<p>Some text after</p>
</div>`;
            const document = parseStringToDOM(content);

            expect(removeProxyUrlsFromContent(document).body.innerHTML).toEqual(cleanedContent);
        });

        it('should not replace images url when not proxy', () => {
            const originalURL = 'https://image.com/image1.png';
            const content = `<div>
<p>Some text before</p>
<img src="${originalURL}" alt="">
<p>Some text after</p>
</div>`;

            const document = parseStringToDOM(content);
            expect(removeProxyUrlsFromContent(document).body.innerHTML).toEqual(content);
        });

        it('should not replace content when no image', () => {
            const content = `<div>
<p>Some text before</p>
<p>Some text after</p>
</div>`;

            const document = parseStringToDOM(content);
            expect(removeProxyUrlsFromContent(document).body.innerHTML).toEqual(content);
        });
    });

    describe('removeEmbeddedImagesFromContent', () => {
        it('should remove blob: URLs', () => {
            const content = `<div>
<p>Some text before</p>
<img src="blob:https://mail.proton.dev/whatever" alt="embedded">
<p>Some text after</p>
</div>`;
            const expectedContent = `<div>
<p>Some text before</p>

<p>Some text after</p>
</div>`;
            const document = parseStringToDOM(content);

            expect(removeEmbeddedImagesFromContent(document).body.innerHTML).toEqual(expectedContent);
        });

        it('should remove cid: URLs', () => {
            const content = `<div>
<p>Some text before</p>
<img src="cid:image123@mail.proton.me" alt="embedded">
<p>Some text after</p>
</div>`;
            const expectedContent = `<div>
<p>Some text before</p>

<p>Some text after</p>
</div>`;
            const document = parseStringToDOM(content);

            expect(removeEmbeddedImagesFromContent(document).body.innerHTML).toEqual(expectedContent);
        });

        it('should keep data: URLs (base64 images)', () => {
            const dataURL = 'data:image/png;base64,whatever';
            const content = `<div>
<p>Some text before</p>
<img src="${dataURL}" alt="base64">
<p>Some text after</p>
</div>`;
            const document = parseStringToDOM(content);

            expect(removeEmbeddedImagesFromContent(document).body.innerHTML).toEqual(content);
        });

        it('should keep http/https URLs', () => {
            const imageURL = 'https://image.com/image.png';
            const content = `<div>
<p>Some text before</p>
<img src="${imageURL}" alt="external">
<p>Some text after</p>
</div>`;
            const document = parseStringToDOM(content);

            expect(removeEmbeddedImagesFromContent(document).body.innerHTML).toEqual(content);
        });

        it('should handle mixed image types correctly', () => {
            const dataURL = 'data:image/png;base64,whatever';
            const httpURL = 'https://image.com/image.png';
            const blobURL = 'blob:https://mail.proton.dev/whatever';
            const cidURL = 'cid:image123@mail.proton.me';

            const content = `<div>
<img src="${dataURL}" alt="base64">
<img src="${httpURL}" alt="external">
<img src="${blobURL}" alt="blob">
<img src="${cidURL}" alt="cid">
</div>`;
            const expectedContent = `<div>
<img src="${dataURL}" alt="base64">
<img src="${httpURL}" alt="external">


</div>`;
            const document = parseStringToDOM(content);

            expect(removeEmbeddedImagesFromContent(document).body.innerHTML).toEqual(expectedContent);
        });

        it('should not modify content when no images are present', () => {
            const content = `<div>
<p>Some text before</p>
<p>Some text after</p>
</div>`;
            const document = parseStringToDOM(content);

            expect(removeEmbeddedImagesFromContent(document).body.innerHTML).toEqual(content);
        });

        it('should not modify content when only safe images are present', () => {
            const dataURL = 'data:image/png;base64,whatever';
            const httpURL = 'https://image.com/image.png';
            const content = `<div>
<img src="${dataURL}" alt="base64">
<img src="${httpURL}" alt="external">
</div>`;
            const document = parseStringToDOM(content);

            expect(removeEmbeddedImagesFromContent(document).body.innerHTML).toEqual(content);
        });
    });
});
