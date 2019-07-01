import { parseURL } from '../../../src/helpers/browser';

const linksMailto = `
<a id="fullwithnewline" href="mailto:qajeanne@protonmail.mk?cc=qajeanne2@protonmail.com&amp;bcc=qajeanne2@gmail.com\n
&amp;subject=The%20subject%20of%20the%20email
&amp;body=The%20body%20of%20the%20
email" rel="noreferrer nofollow noopener"> Send mail with cc, bcc, subject and body</a>
<a id="mailtosolo" href="mailto:qajeanne@protonmail.mk?" rel="noreferrer nofollow noopener"> Send mail with cc, bcc, subject and body</a>
<a id="mailtosubject" href="mailto:qajeanne@protonmail.mk?subject=The%20subject%20of%20the%20email" rel="noreferrer nofollow noopener"> Send mail with cc, bcc, subject and body</a>
<a id="mailtofullnormal" href="mailto:qajeanne@protonmail.mk?cc=qajeanne2@protonmail.com&amp;bcc=qajeanne2@gmail.com&amp;subject=The%20subject%20of%20the%20email&amp;body=The%20body%20of%20th\ne%20email\n\n\n" rel="noreferrer nofollow noopener"> Send mail with cc, bcc, subject and body</a>
<a id="mailtomanyinterogations" href="mailto:qajeanne@protonmail.mk?cc=qajeanne2@protonmail.com&subject=hello?&foo=bar" rel="noreferrer nofollow noopener"> Send mail with cc, bcc, subject and body</a>
`

describe('Parse an URL to extract queryParams', () => {

    const dom = document.createElement('DIV');
    dom.innerHTML = linksMailto;

    const toQueryParams = (selector) => {
        const { searchObject } = parseURL(dom.querySelector(selector).href);
        return searchObject;
    };

    it('should find no queryParams', () => {
        const keys = Object.keys(toQueryParams('#mailtosolo'));
        expect(keys).toEqual([]);
    });

    it('should find only a subject', () => {
        const params = toQueryParams('#mailtosubject');
        expect(Object.keys(params).length).toBe(1);
        expect(params.subject).toBe('The subject of the email');
    });

    it('should many params', () => {
        const params = toQueryParams('#mailtofullnormal');
        expect(Object.keys(params).length).toBe(4);
        expect(params.cc).toBe('qajeanne2@protonmail.com');
        expect(params.bcc).toBe('qajeanne2@gmail.com');
        expect(params.subject).toBe('The subject of the email');
        expect(params.body).toBe('The body of the email');
    });

    it('should remove new lines if !body', () => {
        const params = toQueryParams('#fullwithnewline');

        expect(Object.keys(params).length).toBe(4);
        expect(params.cc).toBe('qajeanne2@protonmail.com');
        expect(params.bcc).toBe('qajeanne2@gmail.com');
        expect(params.subject).toBe('The subject of the email');
        expect(params.body).toBe('The body of the email');
    });

    it('should deal with many ? inside the URL', () => {
        const params = toQueryParams('#mailtomanyinterogations');

        expect(Object.keys(params).length).toBe(3);
        expect(params.cc).toBe('qajeanne2@protonmail.com');
        expect(params.foo).toBe('bar');
        expect(params.subject).toBe('hello?');
    });

})
