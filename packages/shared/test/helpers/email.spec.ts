import {
    normalizeEmail,
    normalizeInternalEmail,
    parseMailtoURL,
    validateEmailAddress,
    validateDomain,
} from '../../lib/helpers/email';

describe('email', () => {
    describe('validateDomain', () => {
        it('should accept valid domains', () => {
            const domains = [
                'protonmail.com',
                'mail.proton.me.',
                'vpn.at.proton.me',
                'pro-ton.mail.com',
                'xn--80ak6aa92e.com',
                '_dnslink.ipfs.io',
                'n.mk',
                'a-1234567890-1234567890-1234567890-1234567890-1234567890-1234-z.eu.us',
                'external.asd1230-123.asd_internal.asd.gm-_ail.com',
            ];
            const results = domains.map((domain) => validateDomain(domain));
            const expected = domains.map(() => true);
            expect(results).toEqual(expected);
        });

        it('should reject invalid domains', () => {
            const domains = ['protonmail', '-mail.proton.me.', '1234', '[123.32]', 'pro*ton.mail.com'];
            const results = domains.map((domain) => validateDomain(domain));
            const expected = domains.map(() => false);
            expect(results).toEqual(expected);
        });
    });

    describe('validateEmailAddress', () => {
        it('should validate good email addresses', () => {
            const emails = [
                'test@protonmail.com',
                '(comment)test+test(ot@" her)@pm.me',
                'test@[192.168.1.1]',
                'test(rare)@[192.168.12.23]',
                '(comment)"te@ st"(rare)@[192.168.12.23]',
                "weird!#$%&'*+-/=?^_`{|}~123@pa-ta-Ton32.com.edu.org",
            ];
            expect(emails.map((email) => validateEmailAddress(email)).filter(Boolean).length).toBe(emails.length);
        });

        it('should not validate malformed email addresses', () => {
            const emails = [
                'hello',
                'hello.@test.com',
                'he..lo@test.com',
                '.hello@test.com',
                'test@[192.168.1.1.2]',
                'test(rare)@[19245.168.12.23]',
                'test@domain',
                'test@domain.b',
                'test@-domain.com',
                'test@domain-.com',
                'test@test@domain.com',
                'français@baguette.fr',
                'ezpaña@espain.es',
            ];
            expect(emails.map((email) => validateEmailAddress(email)).filter(Boolean).length).toBe(0);
        });
    });

    describe('normalizeEmail', () => {
        it('should lower case external emails', () => {
            const emails = ['testing@myDomain', 'TeS.--TinG@MYDOMAIN', 'ABC;;@cde', 'bad@email@this.is'];
            const expected = emails.map((email) => email.toLowerCase());
            expect(emails.map((email) => normalizeEmail(email))).toEqual(expected);
            expect(emails.map((email) => normalizeEmail(email, false))).toEqual(expected);
        });

        it('should normalize internal emails properly', () => {
            const emails = [
                'testing@pm.me',
                'TeS.--TinG@PM.ME',
                'ABC;;@pm.me',
                'mo____.-..reTes--_---ting@pm.me',
                'bad@email@this.is',
            ];
            const normalized = [
                'testing@pm.me',
                'testing@PM.ME',
                'abc;;@pm.me',
                'moretesting@pm.me',
                'bad@email@this.is',
            ];
            expect(emails.map((email) => normalizeEmail(email, true))).toEqual(normalized);
            expect(emails.map(normalizeInternalEmail)).toEqual(normalized);
        });
    });

    describe('parseMailtoURL', () => {
        it('should extract all "to emails" from the mailtoURL', () => {
            const mailtoURLs = [
                'mailTo:addr1@an.example',
                'mailTo:gr%C3%B3in@dwarf.com',
                'mailto:infobot@example.com?body=send%20current-issue',
                'mailto:?to=addr1@an.example,addr2@an.example',
                'mailto:list@example.org?In-Reply-To=%3C3469A91.D10AF4C@example.com%3E',
                'mailto:addr1@an.example,addr2@an.example?to=addr3@an.example,addr4@an.example',
            ];
            const expected = [
                ['addr1@an.example'],
                ['gróin@dwarf.com'],
                ['infobot@example.com'],
                ['addr1@an.example', 'addr2@an.example'],
                ['list@example.org'],
                ['addr1@an.example', 'addr2@an.example', 'addr3@an.example', 'addr4@an.example'],
            ];
            expect(mailtoURLs.map((to) => parseMailtoURL(to))).toEqual(expected.map((to) => ({ to })));
        });
    });
});
