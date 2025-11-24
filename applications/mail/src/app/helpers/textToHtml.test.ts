import type { MailSettings, UserModel } from '@proton/shared/lib/interfaces';

import { textToHtml } from './textToHtml';

const fakePaidUser = { isFree: true } as UserModel;

describe('textToHtml', () => {
    it('should convert simple string from plain text to html', () => {
        expect(textToHtml('This a simple string', '', undefined, undefined, fakePaidUser)).toEqual(
            'This a simple string'
        );
    });

    it('should convert multiline string too', () => {
        const html = textToHtml(
            `Hello
this is a multiline string`,
            '',
            undefined,
            undefined,
            fakePaidUser
        );

        expect(html).toEqual(`Hello<br>
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
            undefined,
            fakePaidUser
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
            undefined,
            fakePaidUser
        );

        expect(html).toEqual(`a title<br>
--<br>
this is a multiline string`);
    });
});
