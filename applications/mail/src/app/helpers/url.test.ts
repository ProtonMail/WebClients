import { protonizer } from '@proton/sanitize/purify';

import { removeLineBreaks } from './test/message';
import { mailtoParser, toAddresses } from './url';

describe('toAddresses', () => {
    it('should split an addresses string to a list of recipients', function () {
        expect(toAddresses('address1@pm.me, address2@pm.me')).toEqual([
            { Name: 'address1@pm.me', Address: 'address1@pm.me' },
            { Name: 'address2@pm.me', Address: 'address2@pm.me' },
        ]);

        expect(toAddresses('Address1 <address1@pm.me>')).toEqual([{ Name: 'Address1', Address: 'address1@pm.me' }]);
    });
});

describe('mailtoParser', () => {
    describe('scheme validation', () => {
        it('should return an empty object for an empty input', () => {
            expect(mailtoParser('')).toEqual({});
        });

        it('should return an empty object for an https input', () => {
            expect(mailtoParser('https://proton.me')).toEqual({});
        });

        it('should return an empty object for a bare email input', () => {
            expect(mailtoParser('test@proton.me')).toEqual({});
        });

        it('should return an empty object for a tel input', () => {
            expect(mailtoParser('tel:+41000000000')).toEqual({});
        });

        it('should accept an uppercase MAILTO scheme', () => {
            const { data } = mailtoParser('MAILTO:address1@pm.me');

            expect(data?.ToList).toEqual([{ Name: 'address1@pm.me', Address: 'address1@pm.me' }]);
        });
    });

    describe('TO list', () => {
        it('should detect a single address', () => {
            const { data } = mailtoParser('mailto:address1@pm.me?subject=Mail subject');
            expect(data?.ToList).toEqual([{ Name: 'address1@pm.me', Address: 'address1@pm.me' }]);
        });

        it('should detect multiple comma-separated addresses', () => {
            const { data } = mailtoParser('mailto:address1@pm.me,address2@pm.me?subject=Mail subject');
            expect(data?.ToList).toEqual([
                { Name: 'address1@pm.me', Address: 'address1@pm.me' },
                { Name: 'address2@pm.me', Address: 'address2@pm.me' },
            ]);
        });

        it('should detect a name and address', () => {
            const { data } = mailtoParser('mailto:Address1 <address1@pm.me>?subject=Mail subject');
            expect(data?.ToList).toEqual([{ Name: 'Address1', Address: 'address1@pm.me' }]);
        });

        it('should detect multiple name and address pairs', () => {
            const { data } = mailtoParser(
                'mailto:Address1 <address1@pm.me>, Address2 <address2@pm.me>?subject=Mail subject'
            );
            expect(data?.ToList).toEqual([
                { Name: 'Address1', Address: 'address1@pm.me' },
                { Name: 'Address2', Address: 'address2@pm.me' },
            ]);
        });

        it('should strip HTML entities from an address', () => {
            // %C2%AD is the soft hyphen "&shy;" HTML entity
            const { data } = mailtoParser('mailto:address%C2%AD1@pm.me?subject=Mail subject');
            expect(data?.ToList).toEqual([{ Name: 'address1@pm.me', Address: 'address1@pm.me' }]);
        });

        it('should not set a ToList when the recipient is missing', () => {
            const { data } = mailtoParser('mailto:?subject=Mail subject');
            expect(data?.ToList).toBeUndefined();
            expect(data?.Subject).toEqual('Mail subject');
        });

        it('should preserve a + in the recipient alias instead of turning it into a space', () => {
            const { data } = mailtoParser('mailto:user+tag@proton.me');
            expect(data?.ToList).toEqual([{ Name: 'user+tag@proton.me', Address: 'user+tag@proton.me' }]);
        });
    });

    describe('CC list', () => {
        it('should detect a single address', () => {
            const { data } = mailtoParser('mailto:address3@pm.me?subject=Mail subject&cc=address1@pm.me');
            expect(data?.CCList).toEqual([{ Name: 'address1@pm.me', Address: 'address1@pm.me' }]);
        });

        it('should detect multiple comma-separated addresses', () => {
            const { data } = mailtoParser(
                'mailto:address3@pm.me?subject=Mail subject&cc=address1@pm.me,address2@pm.me'
            );
            expect(data?.CCList).toEqual([
                { Name: 'address1@pm.me', Address: 'address1@pm.me' },
                { Name: 'address2@pm.me', Address: 'address2@pm.me' },
            ]);
        });

        it('should detect a name and address', () => {
            const { data } = mailtoParser('mailto:address3@pm.me?subject=Mail subject&cc=Address1 <address1@pm.me>');
            expect(data?.CCList).toEqual([{ Name: 'Address1', Address: 'address1@pm.me' }]);
        });

        it('should detect multiple name and address pairs', () => {
            const { data } = mailtoParser(
                'mailto:address3@pm.me?subject=Mail subject&cc=Address1 <address1@pm.me>, Address2 <address2@pm.me>'
            );
            expect(data?.CCList).toEqual([
                { Name: 'Address1', Address: 'address1@pm.me' },
                { Name: 'Address2', Address: 'address2@pm.me' },
            ]);
        });

        it('should strip HTML entities from an address', () => {
            const { data } = mailtoParser('mailto:address3@pm.me?subject=Mail subject&cc=address%C2%AD1@pm.me');
            expect(data?.CCList).toEqual([{ Name: 'address1@pm.me', Address: 'address1@pm.me' }]);
        });

        it('should preserve a + in a cc alias instead of turning it into a space', () => {
            const { data } = mailtoParser('mailto:address1@pm.me?cc=cc+tag@proton.me');
            expect(data?.CCList).toEqual([{ Name: 'cc+tag@proton.me', Address: 'cc+tag@proton.me' }]);
        });
    });

    describe('BCC list', () => {
        it('should detect a single address', () => {
            const { data } = mailtoParser('mailto:address3@pm.me?subject=Mail subject&bcc=address1@pm.me');
            expect(data?.BCCList).toEqual([{ Name: 'address1@pm.me', Address: 'address1@pm.me' }]);
        });

        it('should detect multiple comma-separated addresses', () => {
            const { data } = mailtoParser(
                'mailto:address3@pm.me?subject=Mail subject&bcc=address1@pm.me,address2@pm.me'
            );
            expect(data?.BCCList).toEqual([
                { Name: 'address1@pm.me', Address: 'address1@pm.me' },
                { Name: 'address2@pm.me', Address: 'address2@pm.me' },
            ]);
        });

        it('should detect a name and address', () => {
            const { data } = mailtoParser('mailto:address3@pm.me?subject=Mail subject&bcc=Address1 <address1@pm.me>');
            expect(data?.BCCList).toEqual([{ Name: 'Address1', Address: 'address1@pm.me' }]);
        });

        it('should detect multiple name and address pairs', () => {
            const { data } = mailtoParser(
                'mailto:address3@pm.me?subject=Mail subject&bcc=Address1 <address1@pm.me>, Address2 <address2@pm.me>'
            );
            expect(data?.BCCList).toEqual([
                { Name: 'Address1', Address: 'address1@pm.me' },
                { Name: 'Address2', Address: 'address2@pm.me' },
            ]);
        });

        it('should strip HTML entities from an address', () => {
            const { data } = mailtoParser('mailto:address3@pm.me?subject=Mail subject&bcc=address%C2%AD1@pm.me');
            expect(data?.BCCList).toEqual([{ Name: 'address1@pm.me', Address: 'address1@pm.me' }]);
        });

        it('should preserve a + in a bcc alias instead of turning it into a space', () => {
            const { data } = mailtoParser('mailto:address1@pm.me?bcc=bcc+tag@proton.me');
            expect(data?.BCCList).toEqual([{ Name: 'bcc+tag@proton.me', Address: 'bcc+tag@proton.me' }]);
        });
    });

    describe('subject', () => {
        it('should detect the subject', () => {
            const { data } = mailtoParser('mailto:address1@pm.me?subject=Mail subject');
            expect(data?.Subject).toEqual('Mail subject');
        });

        it('should preserve percent signs', () => {
            const { data } = mailtoParser('mailto:test@example.com?subject=50%25%20off');
            expect(data?.Subject).toEqual('50% off');
        });

        it('should preserve + signs', () => {
            const { data } = mailtoParser('mailto:test@example.com?subject=1+1=2');
            expect(data?.Subject).toEqual('1+1=2');
        });
    });

    describe('body', () => {
        it('should detect a plain text body', () => {
            const { decryption } = mailtoParser('mailto:address1@pm.me?subject=Mail subject&body=Mail body');
            const expectedBody = protonizer('Mail body', true).innerHTML;
            expect(removeLineBreaks(decryption?.decryptedBody || '')).toEqual(removeLineBreaks(expectedBody));
        });

        it('should detect an HTML body with images', () => {
            const bodyWithImages = `<div>
    Body of the email
    <img src="imageUrl" style="width:auto;">
</div>`;
            const { decryption } = mailtoParser(`mailto:address1@pm.me?subject=Mail subject&body=${bodyWithImages}`);
            const expectedBody = protonizer(bodyWithImages, true).innerHTML;
            expect(removeLineBreaks(decryption?.decryptedBody || '')).toEqual(removeLineBreaks(expectedBody));
        });

        it('should preserve %0A (LF) newlines as line breaks', () => {
            const { decryption } = mailtoParser('mailto:address1@pm.me?subject=Mail subject&body=Line%201%0ALine%202');
            expect(decryption?.decryptedBody).toContain('Line 1');
            expect(decryption?.decryptedBody).toContain('Line 2');
            expect(decryption?.decryptedBody).toMatch(/Line 1.*<br\s*\/?>.*Line 2/s);
        });

        it('should preserve %0D%0A (CRLF) newlines as line breaks', () => {
            const { decryption } = mailtoParser(
                'mailto:address1@pm.me?subject=Mail subject&body=Line%201%0D%0ALine%202'
            );
            expect(decryption?.decryptedBody).toContain('Line 1');
            expect(decryption?.decryptedBody).toContain('Line 2');
            expect(decryption?.decryptedBody).toMatch(/Line 1.*<br\s*\/?>.*Line 2/s);
        });

        it('should not convert literal backslash-n to line breaks (non-compliant)', () => {
            const { decryption } = mailtoParser(
                'mailto:address1@pm.me?subject=Mail subject&body=Line%20one\\nLine%20two'
            );
            expect(decryption?.decryptedBody).toContain('Line one\\nLine two');
        });

        it('should preserve percent signs', () => {
            const { decryption } = mailtoParser('mailto:test@example.com?body=100%25%20done');
            expect(decryption?.decryptedBody).toContain('100% done');
        });

        it('should preserve + signs', () => {
            const { decryption } = mailtoParser('mailto:test@example.com?body=1+1=2');
            expect(decryption?.decryptedBody).toContain('1+1=2');
        });
    });

    describe('query parsing', () => {
        it('should ignore unknown query parameters', () => {
            const { data, decryption } = mailtoParser('mailto:address1@pm.me?foo=bar&unknown=value');
            expect(data?.Subject).toBeUndefined();
            expect(data?.CCList).toBeUndefined();
            expect(data?.BCCList).toBeUndefined();
            expect(decryption?.decryptedBody).toBeUndefined();
        });

        it('should parse parameter keys case-insensitively', () => {
            const { data } = mailtoParser('mailto:address1@pm.me?SUBJECT=Mail subject');
            expect(data?.Subject).toEqual('Mail subject');
        });

        it('should not set the subject when the parameter value is empty', () => {
            const { data } = mailtoParser('mailto:address1@pm.me?subject=');
            expect(data?.Subject).toBeUndefined();
        });

        it('should ignore a parameter that has no value assignment', () => {
            const { data } = mailtoParser('mailto:address1@pm.me?subject&cc=address2@pm.me');
            expect(data?.Subject).toBeUndefined();
            expect(data?.CCList).toEqual([{ Name: 'address2@pm.me', Address: 'address2@pm.me' }]);
        });

        it('should keep an encoded ampersand (%26) inside a single parameter', () => {
            const { data } = mailtoParser('mailto:address1@pm.me?subject=A%26B&cc=address2@pm.me');
            // The %26 must not split the subject into an extra param, and cc must still be parsed.
            expect(data?.Subject).toContain('B');
            expect(data?.CCList).toEqual([{ Name: 'address2@pm.me', Address: 'address2@pm.me' }]);
        });
    });

    it('should detect all fields in a mailto string', () => {
        const { data, decryption } = mailtoParser(
            'mailto:address1@pm.me?subject=Mail subject&cc=address2@pm.me,address3@pm.me&bcc=address4@pm.me&body=Mail body'
        );
        const expectedBody = protonizer('Mail body', true).innerHTML;
        expect(data?.ToList).toEqual([{ Name: 'address1@pm.me', Address: 'address1@pm.me' }]);
        expect(data?.Subject).toEqual('Mail subject');
        expect(data?.CCList).toEqual([
            { Name: 'address2@pm.me', Address: 'address2@pm.me' },
            { Name: 'address3@pm.me', Address: 'address3@pm.me' },
        ]);
        expect(data?.BCCList).toEqual([{ Name: 'address4@pm.me', Address: 'address4@pm.me' }]);
        expect(removeLineBreaks(decryption?.decryptedBody || '')).toEqual(removeLineBreaks(expectedBody));
    });
});
