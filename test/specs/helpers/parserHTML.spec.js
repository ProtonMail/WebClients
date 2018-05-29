import { toText } from '../../../src/helpers/parserHTML';

const CASE_TEXT_LI = `<div class="protonmail_signature_block"><div class="protonmail_signature_block-user"><div>jeanne mange&nbsp;<b>une boule de glace</b>&nbsp;<i>à la vanille.</i><br></div><ul><li>Une vache<br></li><li>Un ane<br></li><li>Une brebis<br></li></ul><div>A table<br></div></div><div><br></div><div class="protonmail_signature_block-proton">Sent with <a href="https://protonmail.com" target="_blank">ProtonMail</a> Secure Email.<br></div></div>`;
const CASE_TEXT_LI_TXT = `


​jeanne mange une boule de glace à la vanille.

-   Une vache
-   Un ane
-   Une brebis

A table

Sent with ProtonMail Secure Email.​

`;
const CASE_TEXT_EXTRA = `<div class="protonmail_signature_block"><div class="protonmail_signature_block-user"><div>: <a href="http://anothercoffee.net">http://anothercoffee.net</a><br></div><div>: Drupal to WordPress migration specialists<br></div><div>:<br></div><div>: Another Cup of Coffee Limited<br></div><div>: Registered in England and Wales number 05992203<br></div></div><div><br></div><div class="protonmail_signature_block-proton">Sent with <a href="https://protonmail.com" target="_blank">ProtonMail</a> Secure Email.<br></div></div>`;
const CASE_TEXT_EXTRA_TXT = `


​: http://anothercoffee.net
: Drupal to WordPress migration specialists
:
: Another Cup of Coffee Limited
: Registered in England and Wales number 05992203

Sent with ProtonMail Secure Email.​

`;

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
        expect(toText(CASE_TEXT_LI)).toEqual(CASE_TEXT_LI_TXT);
    });

    it('should convert to the right format', () => {
        expect(toText(CASE_TEXT_EXTRA)).toEqual(CASE_TEXT_EXTRA_TXT);
    });

});
