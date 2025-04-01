import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import { removeProxyUrlsFromContent } from '@proton/shared/lib/mail/images';

describe('Images helpers', () => {
    describe('removeProxyUrlsFromContent', () => {
        it('should replace images with their original URLs', () => {
            const originalURL = 'https://image.com/image1.png';
            const proxyURL = `https://mail.proton.me/api/core/v4/images?Url=${originalURL}&DryRun=0&UID=userID`;
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
});
