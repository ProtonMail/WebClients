import { toText } from './parserHtml';

describe('toText', () => {
    it('should not escape single underline', () => {
        const string = 'MONO_TLS_PROVIDER';
        expect(toText(string)).toEqual(string);
    });

    it('should not escape multiple underlines', () => {
        const string = '___';
        expect(toText(string)).toEqual(string);
    });

    it('should convert to the right format if there are LIs', () => {
        const input = `
<div class="protonmail_signature_block">
    <div class="protonmail_signature_block-user">
        <div>jeanne mange&nbsp;<b>une boule de glace</b>&nbsp;<i>à la vanille.</i><br></div>
        <ul>
            <li>Une vache<br></li>
            <li>Un ane<br></li>
            <li>Une brebis<br></li>
        </ul>
        <div>A table<br></div>
    </div>
    <div><br></div>
    <div class="protonmail_signature_block-proton">Sent with <a href="https://proton.me/?utm_campaign=ww-all-2a-mail-pmm_mail-protonmail_signature&utm_source=proton_users&utm_medium=cta&utm_content=sent_with_protonmail_secure_email" target="_blank">ProtonMail</a> Secure Email.<br></div>
</div>`;
        const result = `jeanne mange\xa0une boule de glace\xa0à la vanille.

-   Une vache
-   Un ane
-   Une brebis

A table

Sent with ProtonMail Secure Email.`;

        expect(toText(input)).toEqual(result);
    });

    it('should convert to the right format', () => {
        const input = `
<div class="protonmail_signature_block">
    <div class="protonmail_signature_block-user">
        <div>: <a href="http://anothercoffee.net">http://anothercoffee.net</a><br></div>
        <div>: Drupal to WordPress migration specialists<br></div>
        <div>:<br></div>
        <div>: Another Cup of Coffee Limited<br></div>
        <div>: Registered in England and Wales number 05992203<br></div>
    </div>
    <div><br></div>
    <div class="protonmail_signature_block-proton">Sent with <a href="https://proton.me/?utm_campaign=ww-all-2a-mail-pmm_mail-protonmail_signature&utm_source=proton_users&utm_medium=cta&utm_content=sent_with_protonmail_secure_email" target="_blank">ProtonMail</a> Secure Email.<br></div>
</div>`;

        const result = `: http://anothercoffee.net
: Drupal to WordPress migration specialists
:
: Another Cup of Coffee Limited
: Registered in England and Wales number 05992203

Sent with ProtonMail Secure Email.`;

        expect(toText(input)).toEqual(result);
    });

    it('should keep the lines in signature', () => {
        const input = `
<div class="protonmail_signature_block">
    <div class="protonmail_signature_block-user">
        <div>---<br></div><div>This is a test account<br></div><div><br></div><div>swiip.test@protonmail.com<br></div>
    </div>
    <div class="protonmail_signature_block-proton protonmail_signature_block-empty">
    </div>
</div>
        `;

        const result = `---
This is a test account

swiip.test@protonmail.com`;

        expect(toText(input)).toBe(result);
    });

    it('should keep the lines in original message', () => {
        const input = `
<blockquote class="protonmail_quote" type="cite">
    <div>Hey, this is a plain text message!<br>
    <br>
    Even with no less than 2 lines!</div>
</blockquote>
`;

        const result = `> Hey, this is a plain text message!
> 
> Even with no less than 2 lines!`;

        expect(toText(input)).toBe(result);
    });

    it('should keep the lines in list', () => {
        const input = `
<ul>
    <li>content 1<br> content<br></li>
    <li>content 2<br> content</li>
</ul>
        `;

        const result = `-   content 1
    content
-   content 2
    content`;

        expect(toText(input)).toBe(result);
    });

    it('should keep empty lines in the beginning', () => {
        const input = `
            <div style="font-family: verdana; font-size: 20px;"><br></div>
            <div style="font-family: verdana; font-size: 20px;"><br></div>
            <div style="font-family: verdana; font-size: 20px;">test<br></div>
            <div style="font-family: verdana; font-size: 20px;"><br></div>
            <div style="font-family: verdana; font-size: 20px;"><br></div>
            <div style="font-family: verdana; font-size: 20px;"><br></div>
            <div style="font-family: verdana; font-size: 20px;"><br></div>
            <div style="font-family: verdana; font-size: 20px;"><br></div>
            <div class="protonmail_signature_block" style="font-family: verdana; font-size: 20px;">
                <div class="protonmail_signature_block-user">
                    <div style="font-family:arial;font-size:14px;color:rgb(34,34,34);">my signature</div>
                </div>
                <div class="protonmail_signature_block-proton protonmail_signature_block-empty">
                </div>
            </div>
        `;

        const result = `

test





my signature`;

        expect(toText(input)).toBe(result);
    });

    it('should keep empty lines in the content and the signature', () => {
        const input = `
            <div style="font-family: verdana; font-size: 20px;">Testcontent1</div>
            <div style="font-family: verdana; font-size: 20px;"><br></div>
            <div style="font-family: verdana; font-size: 20px;">Testcontent2</div>
            <div style="font-family: verdana; font-size: 20px;"><br></div>
            <div style="font-family: verdana; font-size: 20px;">Testcontent3</div>
            <div style="font-family: verdana; font-size: 20px;"><br></div>
            <div class="protonmail_signature_block" style="font-family: verdana; font-size: 20px;">
                <div class="protonmail_signature_block-user">
                    <div style="font-family:arial;font-size:14px;color:rgb(34,34,34);">Test1</div>
                    <div style="font-family:arial;font-size:14px;color:rgb(34,34,34);"><br></div>
                    <div style="font-family:arial;font-size:14px;color:rgb(34,34,34);">Testtest2</div>
                    <div style="font-family:arial;font-size:14px;color:rgb(34,34,34);"><br></div>
                    <div style="font-family:arial;font-size:14px;color:rgb(34,34,34);">Testtesttest3</div>
                    <div style="font-family:arial;font-size:14px;color:rgb(34,34,34);"><br></div>
                    <div style="font-family:arial;font-size:14px;color:rgb(34,34,34);">Testtesttesttest4</div>
                </div>
                <div class="protonmail_signature_block-proton protonmail_signature_block-empty"></div>
            </div>
        `;

        const result = `Testcontent1

Testcontent2

Testcontent3

Test1

Testtest2

Testtesttest3

Testtesttesttest4`;

        expect(toText(input)).toBe(result);
    });

    it('should remove images from the content', () => {
        const input = `
            <div>
            <div>Text before image</div>
            <div><br></div>
            <img src="imageURL"/>
            <div>Text after image</div>
</div>
        `;

        const result = `Text before image

Text after image`;

        expect(toText(input)).toBe(result);
    });
});
