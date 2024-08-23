import { getMessageContentBeforeBlockquote } from './contentFromComposerMessage';

describe('getMessageContentBeforeBlockquote', () => {
    it('should return empty string if editorContent is empty', () => {
        expect(
            getMessageContentBeforeBlockquote({
                editorType: 'plaintext',
                editorContent: '',
                addressSignature: 'signature',
            })
        ).toBe('');

        expect(
            getMessageContentBeforeBlockquote({
                editorType: 'html',
                editorContent: '',
                returnType: 'plaintext',
            })
        ).toBe('');
    });

    it('should return content if no signature', () => {
        expect(
            getMessageContentBeforeBlockquote({
                editorType: 'plaintext',
                editorContent: 'Hello this is some plain text content',
                addressSignature: '',
            })
        ).toBe('Hello this is some plain text content');
    });

    it('should return content before signature if signature', () => {
        expect(
            getMessageContentBeforeBlockquote({
                editorType: 'plaintext',
                editorContent: 'Hello this is some plain text content\n\n--\nSignature',
                addressSignature: '\n\n--\nSignature',
            })
        ).toBe('Hello this is some plain text content');

        // Innertext is not supported in jsdom
        // https://github.com/jsdom/jsdom/issues/1245#issuecomment-966545022
        // And alternatives like textContent dont not handle \n.

        // expect(
        //     getMessageContentBeforeBlockquote({
        //         editorType: 'html',
        //         editorContent:
        //             '<div>Hello this is content</div><div class="protonmail_signature_block">Signature</div>',
        //     })
        // ).toBe('Hello this is content');
    });
});
