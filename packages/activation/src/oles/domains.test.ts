import { getRecordHost, getSubdomain } from './domains';

describe('getSubdomain', () => {
    it.each([
        ['example.com', ''],
        ['example.co.uk', ''],
        ['mail.example.com', 'mail'],
        ['mail.example.co.uk', 'mail'],
        ['a.b.example.com', 'a.b'],
        ['EXAMPLE.COM', ''],
        ['mail.EXAMPLE.com', 'mail'],
    ])('detects the subdomain of "%s" as "%s"', (domainName, expected) => {
        expect(getSubdomain(domainName)).toBe(expected);
    });

    it.each([undefined, '', '   '])('returns "" for the non-domain value %p', (value) => {
        expect(getSubdomain(value as string | undefined)).toBe('');
    });
});

describe('getRecordHost', () => {
    describe('without a subdomain (root domain)', () => {
        it.each([
            ['', ''],
            [undefined, ''],
            ['_dmarc', '_dmarc'],
            ['sel._domainkey', 'sel._domainkey'],
        ])('leaves the base host "%s" unchanged', (host, expected) => {
            expect(getRecordHost(host, '')).toBe(expected);
            expect(getRecordHost(host, undefined)).toBe(expected);
        });
    });

    describe('with a subdomain', () => {
        it('uses the subdomain itself when the base host is blank', () => {
            expect(getRecordHost('', 'mail')).toBe('mail');
            expect(getRecordHost(undefined, 'mail')).toBe('mail');
        });

        it('prepends the subdomain to a non-empty base host', () => {
            expect(getRecordHost('_dmarc', 'mail')).toBe('_dmarc.mail');
            expect(getRecordHost('sel._domainkey', 'mail')).toBe('sel._domainkey.mail');
        });

        it('supports multi-label subdomains', () => {
            expect(getRecordHost('', 'a.b')).toBe('a.b');
            expect(getRecordHost('_dmarc', 'a.b')).toBe('_dmarc.a.b');
        });
    });
});
