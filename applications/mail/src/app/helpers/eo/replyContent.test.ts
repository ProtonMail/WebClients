import { hasNothingBeforeBlockquote } from './replyContent';

// Shapes taken from what the EO composer actually exports for a reply draft
const SIGNATURE_BLOCK = `<div style="font-family: Arial;"><br></div><div style="font-family: Arial;" class="protonmail_signature_block protonmail_signature_block-empty"><div class="protonmail_signature_block-user protonmail_signature_block-empty"></div><div class="protonmail_signature_block-proton protonmail_signature_block-empty"></div></div><div style="font-family: Arial;"><br></div>`;
const QUOTE = `<div class="protonmail_quote">On Monday, EO Sender &lt;sender@proton.me&gt; wrote:<br><blockquote class="protonmail_quote" type="cite">Test EO body</blockquote><br></div>`;

describe('hasNothingBeforeBlockquote', () => {
    it('flags a reply that is only the signature and the quoted original', () => {
        expect(hasNothingBeforeBlockquote(SIGNATURE_BLOCK + QUOTE)).toBe(true);
    });

    it('flags a reply whose only content before the quote is whitespace', () => {
        expect(hasNothingBeforeBlockquote(`<div>   </div><div><br></div>${SIGNATURE_BLOCK}${QUOTE}`)).toBe(true);
    });

    it('flags a reply with neither a quote nor any text', () => {
        expect(hasNothingBeforeBlockquote(SIGNATURE_BLOCK)).toBe(true);
    });

    it('accepts a reply with typed text before the quote', () => {
        expect(hasNothingBeforeBlockquote(`<div>Hello there</div>${SIGNATURE_BLOCK}${QUOTE}`)).toBe(false);
    });

    it('accepts a reply whose only content is an inline image', () => {
        expect(hasNothingBeforeBlockquote(`<div><img src="blob:image"></div>${SIGNATURE_BLOCK}${QUOTE}`)).toBe(false);
    });

    it('accepts a reply with text but no quote', () => {
        expect(hasNothingBeforeBlockquote(`<div>Hello there</div>${SIGNATURE_BLOCK}`)).toBe(false);
    });
});
