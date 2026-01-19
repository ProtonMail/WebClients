import type { MailSettings } from '@proton/shared/lib/interfaces';
import { PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';

import { textToHtml } from './textToHtml';

const mailSettings = {
    PMSignature: PM_SIGNATURE.LOCKED,
} as unknown as MailSettings;

const emptySignature = `<div style="font-family: Arial, sans-serif; font-size: 14px;"><br /></div>
<div style="font-family: Arial, sans-serif; font-size: 14px;" class="protonmail_signature_block protonmail_signature_block-empty">
    <div class="protonmail_signature_block-user protonmail_signature_block-empty">
        
            </div>
    
            <div class="protonmail_signature_block-proton protonmail_signature_block-empty">
        
            </div>
</div>`;

describe('textToHtml', () => {
    it('should convert simple string from plain text to html', () => {
        const res = textToHtml('This a simple string', '', mailSettings, undefined);
        console.log({ res });
        expect(res).toEqual(`${emptySignature}
This a simple string`);
    });

    it('should convert multiline string too', () => {
        const html = textToHtml(
            `Hello
this is a multiline string`,
            '',
            undefined,
            undefined
        );

        expect(html).toEqual(`${emptySignature}
Hello<br>
this is a multiline string`);
    });

    it('Multi line', () => {
        // Add a little
        const html = textToHtml(
            `a title
## hello
this is a multiline string`,
            '<p>My signature</p>',
            {
                Signature: '<p>My signature</p>',
                FontSize: 16,
                FontFace: 'Arial',
            } as MailSettings,
            undefined
        );

        expect(html).toEqual(`a title<br>
## hello<br>
this is a multiline string`);
    });

    it('should not convert markdown line headings ', () => {
        /**
         * Here the "--" represents a h2 title in markdown
         */
        const html = textToHtml(
            `a title
--
this is a multiline string`,
            '',
            undefined,
            undefined
        );

        expect(html).toEqual(`${emptySignature}
a title<br>
--<br>
this is a multiline string`);
    });
});
