import mails from './__fixtures__/messageBlockquote.fixtures';
import { locateBlockquote } from './messageBlockquote';

/**
 * Creating a whole document each time is needed because locate blockquote is using xpath request
 * which will fail if the content is not actually in the document
 */
const createDocument = (content: string) => {
    const newDocument = document.implementation.createHTMLDocument();
    newDocument.body.innerHTML = content;
    return newDocument.body;
};

describe('messageBlockquote', () => {
    Object.entries(mails as { [name: string]: string }).forEach(([name, content]) => {
        it(`should find the blockquote in the mail ${name}`, () => {
            const [, blockquote] = locateBlockquote(createDocument(content));
            expect(blockquote.length).not.toBe(0);
        });
    });

    it(`should correctly detect proton blockquote with default font and no signature`, () => {
        const content = `
            <div style="font-family: verdana; font-size: 20px;">
                <div style="font-family: verdana; font-size: 20px;"><br></div>
                <div class="protonmail_signature_block protonmail_signature_block-empty" style="font-family: verdana; font-size: 20px;">
                    <div class="protonmail_signature_block-user protonmail_signature_block-empty"></div>
                    <div class="protonmail_signature_block-proton protonmail_signature_block-empty"></div>
                </div>
                <div style="font-family: verdana; font-size: 20px;"><br></div>
                <div class="protonmail_quote">
                    ------- Original Message -------<br>
                    On Tuesday, January 4th, 2022 at 17:13, Swiip - Test account &lt;swiip.test@protonmail.com&gt; wrote:<br>
                    <blockquote class="protonmail_quote" type="cite">
                        <div style="font-family: verdana; font-size: 20px;">
                            <div style="font-family: verdana; font-size: 20px;">test</div>
                            <div class="protonmail_signature_block protonmail_signature_block-empty" style="font-family: verdana; font-size: 20px;">
                                <div class="protonmail_signature_block-user protonmail_signature_block-empty"></div>
                                <div class="protonmail_signature_block-proton protonmail_signature_block-empty"></div>
                            </div>
                        </div>
                    </blockquote><br>
                </div>
            </div>`;

        const [before, after] = locateBlockquote(createDocument(content));

        expect(before).not.toContain('Original Message');
        expect(after).toContain('Original Message');
    });
});
