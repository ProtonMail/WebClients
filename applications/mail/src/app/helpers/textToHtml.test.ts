import type { MailSettings } from '@proton/shared/lib/interfaces';
import { PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';

import { extractContentFromPtag, textToHtml } from './textToHtml';

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

describe('extractContentFromPtag', () => {
    it('should unwrap single paragraph added by markdown-it', () => {
        // markdown-it wraps content in <p> tags
        const content = '<p>User typed text without paragraph</p>';
        expect(extractContentFromPtag(content)).toEqual('User typed text without paragraph');
    });

    it('should handle paragraph with special characters', () => {
        const content = '<p>Special chars: &lt; &gt; &amp;</p>';
        expect(extractContentFromPtag(content)).toEqual('Special chars: &lt; &gt; &amp;');
    });

    it('should NOT unwrap when markdown-it adds multiple paragraphs', () => {
        // When user has multiple lines, markdown-it creates multiple <p> tags
        const content = '<p>First line</p><p>Second line</p>';
        expect(extractContentFromPtag(content)).toBeUndefined();
    });

    it('should handle content with newlines', () => {
        const content = `<p>Line 1
Line 2
Line 3</p>`;
        expect(extractContentFromPtag(content)).toEqual(`Line 1
Line 2
Line 3`);
    });

    it('should reject content with closing p tag in middle', () => {
        const content = '<p>Text with </p> in middle</p>';
        expect(extractContentFromPtag(content)).toEqual('Text with </p> in middle');
    });

    it('should handle content with nested non-p tags', () => {
        const content = '<p><span>Text in span</span> and <div>text in div</div></p>';
        expect(extractContentFromPtag(content)).toEqual('<span>Text in span</span> and <div>text in div</div>');
    });

    // TODO, we can remove these tests later, they are just here to compare the previous and the new implementation
    describe('should match old regex behavior', () => {
        const oldRegexImplementation = (content: string) => {
            return /^<p>(((?!<p>)[\s\S])*)<\/p>$/.exec(content)?.[1];
        };

        const testCases = [
            {
                name: 'single paragraph with simple text',
                input: '<p>Hello World</p>',
                expected: 'Hello World',
            },
            {
                name: 'single paragraph with nested tags',
                input: '<p>Hello <strong>World</strong></p>',
                expected: 'Hello <strong>World</strong>',
            },
            {
                name: 'single paragraph with multiple nested tags',
                input: '<p>Text with <em>emphasis</em> and <strong>bold</strong></p>',
                expected: 'Text with <em>emphasis</em> and <strong>bold</strong>',
            },
            {
                name: 'single paragraph with line breaks',
                input: '<p>Line 1<br>Line 2</p>',
                expected: 'Line 1<br>Line 2',
            },
            {
                name: 'multiple paragraphs (should return undefined)',
                input: '<p>First paragraph</p><p>Second paragraph</p>',
                expected: undefined,
            },
            {
                name: 'content not wrapped in p tag',
                input: 'Hello World',
                expected: undefined,
            },
            {
                name: 'div tag instead of p tag',
                input: '<div>Hello World</div>',
                expected: undefined,
            },
            {
                name: 'nested paragraph tags (should return undefined)',
                input: '<p>Outer <p>Inner</p></p>',
                expected: undefined,
            },
            {
                name: 'empty paragraph',
                input: '<p></p>',
                expected: '',
            },
            {
                name: 'paragraph with only whitespace',
                input: '<p>   </p>',
                expected: '   ',
            },
        ];

        testCases.forEach(({ name, input, expected }) => {
            it(name, () => {
                const newResult = extractContentFromPtag(input);
                const oldResult = oldRegexImplementation(input);

                // Both should produce the same result
                expect(newResult).toEqual(oldResult);
                expect(newResult).toEqual(expected);
            });
        });
    });
});
