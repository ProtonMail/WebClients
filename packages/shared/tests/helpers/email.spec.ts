import {
    CANONICALIZE_SCHEME,
    canonicalizeEmail,
    canonicalizeEmailByGuess,
    canonicalizeInternalEmail,
    getEmailTo,
    isNoReplyEmail,
    lowercaseEmailDomain,
    parseMailtoURL,
    validateDomain,
    validateEmailAddress,
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

        it('should accept Web3 domains', () => {
            const domains = ['alice.eth.x', 'bob.888'];
            const results = domains.map((domain) => validateDomain(domain));
            const expected = domains.map(() => true);
            expect(results).toEqual(expected);
        });

        it('should reject invalid domains', () => {
            const domains = [
                'protonmail',
                '-mail.proton.me.',
                '1234',
                '[123.32]',
                'pro*ton.mail.com',
                'protonmail.com/',
            ];
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
                'simple@example.com',
                'very.common@example.com',
                'disposable.style.email.with+symbol@example.com',
                'other.email-with-hyphen@example.com',
                'fully-qualified-domain@example.com',
                'user.name+tag+sorting@example.com',
                'x@example.com',
                'example-indeed@strange-example.com',
                'example@s.example',
                '" "@example.org',
                '"john..doe"@example.org',
                '"john\\"doe"@example.org',
                '"john\\\\doe"@example.org',
                'mailhost!username@example.org',
                'user%example.com@example.org',
                'customer/department=shipping@example.com',
                'web3@eth.b',
                'crypto@charlie.2b2',
                '!def!xyz%abc@example.com',
                '1234567890123456789012345678901234567890123456789012345678901234+x@a.example.com',
                'test@-domain.com',
                'test@domain-.com',
                'admin@test.xn--9wy623f',
                'admin@xn--svanstrm-t4a.com',
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
                'test@test@domain.com',
                'français@baguette.fr',
                'asd,@asd.com',
                'ezpaña@espain.es',
                'Abc.example.com',
                'A@b@c@example.com',
                'a"b(c)d,e:f;g<h>i[j\\k]l@example.com',
                'just"not"right@example.com',
                'this is"not\\allowed@example.com',
                'this\\ still\\"not\\\\allowed@example.com',
            ];
            expect(emails.map((email) => validateEmailAddress(email)).filter(Boolean).length).toBe(0);
        });
    });

    describe('canonicalize', () => {
        it('should canonicalize internal emails properly', () => {
            const emails = [
                'testing@pm.me',
                'TeS.--TinG@PM.ME',
                'ABC+DEF@protonmail.com',
                'mo____.-.reTes--_---ting+AlIas@protonmail.ch',
                'a.custom-Domain@this.is',
                'no-DOM.a.in+one',
                'NO_DOMAIN+two@',
            ];
            const canonicalized = [
                'testing@pm.me',
                'testing@pm.me',
                'abc@protonmail.com',
                'moretesting@protonmail.ch',
                'acustomdomain@this.is',
                'nodomain',
                'nodomain@',
            ];
            expect(emails.map((email) => canonicalizeInternalEmail(email))).toEqual(canonicalized);
        });

        it('should canonicalize with the gmail scheme', () => {
            const emails = [
                'testing@pm.me',
                'TeS.--TinG@PM.ME',
                'ABC+DEF@protonmail.com',
                'mo____.-.reTes--_---ting+AlIas@protonmail.ch',
                'a.custom-Domain@this.is',
                'no-DOM.a.in+one',
                'NO_DOMAIN+two@',
            ];
            const canonicalized = [
                'testing@pm.me',
                'tes--ting@pm.me',
                'abc@protonmail.com',
                'mo____-retes--_---ting@protonmail.ch',
                'acustom-domain@this.is',
                'no-domain',
                'no_domain@',
            ];
            expect(emails.map((email) => canonicalizeEmail(email, CANONICALIZE_SCHEME.GMAIL))).toEqual(canonicalized);
        });

        it('should canonicalize with the plus scheme', () => {
            const emails = [
                'testing@pm.me',
                'TeS.--TinG@PM.ME',
                'ABC+DEF@protonmail.com',
                'mo____.-.reTes--_---ting+AlIas@protonmail.ch',
                'a.custom-Domain@this.is',
                'no-DOM.a.in+one',
                'NO_DOMAIN+two@',
            ];
            const canonicalized = [
                'testing@pm.me',
                'tes.--ting@pm.me',
                'abc@protonmail.com',
                'mo____.-.retes--_---ting@protonmail.ch',
                'a.custom-domain@this.is',
                'no-dom.a.in',
                'no_domain@',
            ];
            expect(emails.map((email) => canonicalizeEmail(email, CANONICALIZE_SCHEME.PLUS))).toEqual(canonicalized);
        });

        it('should canonicalize guessing the scheme', () => {
            const emails = [
                'testing+1@pm.me',
                'TeS.--TinG+2@PM.ME',
                'A.B.C-+D.E.F@GMAIL.com',
                'mo____.-.reTes--_---ting+AlIas@MAIL.RU',
                'a.custom-Domain+cool@this.is',
                'no-DOM.a.in+one',
                'NO_DOMAIN+two@',
            ];
            const canonicalized = [
                'testing@pm.me',
                'testing@pm.me',
                'abc-@gmail.com',
                'mo____.-.retes--_---ting@mail.ru',
                'a.custom-domain+cool@this.is',
                'no-dom.a.in+one',
                'no_domain+two@',
            ];
            expect(emails.map((email) => canonicalizeEmailByGuess(email))).toEqual(canonicalized);
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

    describe('getEmailTo', () => {
        it('should always return a string', () => {
            expect(typeof getEmailTo('mailto:')).toBe('string');
        });
    });

    describe('isNoReplyEmail', () => {
        it('should detect no-reply emails', () => {
            const emails = [
                'no-reply@example.com',
                'do.not.reply@example.com',
                'noreply@example.com',
                'no_reply@example.com',
                'example@noreply.com', // Only the local part is checked
            ];
            expect(emails.map((email) => isNoReplyEmail(email))).toEqual([true, true, true, true, false]);
        });
    });

    describe('lowercaseEmailDomain', () => {
        it('should leave text without email untouched', () => {
            expect(lowercaseEmailDomain('John DOE')).toBe('John DOE');
        });

        it('should lowercase the domain of an email and keep the local part', () => {
            expect(lowercaseEmailDomain('Security@PROTON.ME')).toBe('Security@proton.me');
        });

        it('should lowercase the domain of emails embedded in text', () => {
            expect(lowercaseEmailDomain('Support <Security@PROTON.ME> and Admin@Proton.CH')).toBe(
                'Support <Security@proton.me> and Admin@proton.ch'
            );
        });

        it('should only lowercase after the last @', () => {
            expect(lowercaseEmailDomain('"A@B"@EXAMPLE.COM')).toBe('"A@B"@example.com');
        });

        it('should lowercase emails surrounded by quoted text', () => {
            expect(lowercaseEmailDomain('example@domain.com')).toBe('example@domain.com');
            expect(lowercaseEmailDomain("'Sundar' sundar@gmaiI.com")).toBe("'Sundar' sundar@gmaii.com");
            expect(lowercaseEmailDomain("'test' email@gmaiI.com 'test")).toBe("'test' email@gmaii.com 'test");
        });

        it('should not lowercase text adjacent to the domain', () => {
            expect(lowercaseEmailDomain("email@gmaiI.com'TEST")).toBe("email@gmaii.com'TEST");
            expect(lowercaseEmailDomain('(a@GmaiI.com)Hello')).toBe('(a@gmaii.com)Hello');
            expect(lowercaseEmailDomain('a@GmaiI.com.')).toBe('a@gmaii.com.');
        });

        it('should lowercase every email when separated by punctuation only', () => {
            expect(lowercaseEmailDomain('a@GmaiI.com,b@GmaiI.com')).toBe('a@gmaii.com,b@gmaii.com');
        });

        it('should still lowercase the valid email inside malformed prefixes and suffixes', () => {
            expect(lowercaseEmailDomain('..security@PayPaI.com')).toBe('..security@paypai.com');
            expect(lowercaseEmailDomain('a..security@PayPaI.com')).toBe('a..security@paypai.com');
            expect(lowercaseEmailDomain('security@PayPaI.com-')).toBe('security@paypai.com-');
        });

        it('should lowercase unicode domains', () => {
            expect(lowercaseEmailDomain('info@BÜCHER.DE')).toBe('info@bücher.de');
        });

        it('should leave text that is not a valid email untouched', () => {
            expect(lowercaseEmailDomain('Hello@World')).toBe('Hello@World');
            expect(lowercaseEmailDomain('Hello @World.COM')).toBe('Hello @World.COM');
        });

        it('should lowercase all emails', () => {
            expect(lowercaseEmailDomain('alice@gmaiI.com AAA bob@gmaiI.com')).toBe(
                'alice@gmaii.com AAA bob@gmaii.com'
            );
        });
    });
});
