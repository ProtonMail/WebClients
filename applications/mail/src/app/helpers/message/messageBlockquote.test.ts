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

        expect(before).not.toContain('On Tuesday');
        expect(after).toContain('On Tuesday');
    });

    it(`should take the last element containing text in case of siblings blockquotes`, () => {
        const content = `
            Email content
            <div class="protonmail_quote">
                blockquote1
            </div>
            <div class="protonmail_quote">
                blockquote2
            </div>`;

        const [before, after] = locateBlockquote(createDocument(content));

        expect(before).toContain('Email content');
        expect(before).toContain('blockquote1');
        expect(before).not.toContain('blockquote2');
        expect(after).toContain('blockquote2');
        expect(after).not.toContain('blockquote1');
    });

    it(`should take the last element containing an image in case of siblings blockquotes`, () => {
        const content = `
            Email content
            <div class="protonmail_quote">
                blockquote1
            </div>
            <div class="protonmail_quote">
                <span class="proton-image-anchor" />
            </div>`;

        const [before, after] = locateBlockquote(createDocument(content));

        expect(before).toContain('Email content');
        expect(before).toContain('blockquote1');
        expect(before).not.toContain('proton-image-anchor');
        expect(after).toContain('proton-image-anchor');
        expect(after).not.toContain('blockquote1');
    });

    it(`should display nothing in blockquote when there is text after blockquotes`, () => {
        const content = `
            Email content
            <div class="protonmail_quote">
                blockquote1
            </div>
            text after blockquote`;

        const [before, after] = locateBlockquote(createDocument(content));

        expect(before).toContain('Email content');
        expect(before).toContain('blockquote1');
        expect(before).toContain('text after blockquote');
        expect(after).toEqual('');
    });

    it(`should display nothing in blockquote when there is an image after blockquotes`, () => {
        const content = `
            Email content
            <div class="protonmail_quote">
                blockquote1
            </div>
             <span class="proton-image-anchor" />`;

        const [before, after] = locateBlockquote(createDocument(content));

        expect(before).toContain('Email content');
        expect(before).toContain('blockquote1');
        expect(before).toContain('proton-image-anchor');
        expect(after).toEqual('');
    });
});
