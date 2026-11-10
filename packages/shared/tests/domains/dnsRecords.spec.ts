import type { DnsRecord, DomainDnsRecords } from '../../lib/domains/dnsRecords';
import {
    DnsRecordType,
    applyZoneManagerOverrides,
    getDefaultDnsRecords,
    getDomainDnsRecords,
} from '../../lib/domains/dnsRecords';
import { ZoneManager, getZoneManagerOverrides } from '../../lib/domains/zoneManagers';
import { DKIM_STATE } from '../../lib/interfaces/Domain';

const VERIFY_CODE = 'protonmail-verification=c701d4a2b3';

const DKIM = {
    State: DKIM_STATE.DKIM_STATE_DEFAULT,
    Config: ['protonmail', 'protonmail2', 'protonmail3'].map((selector) => ({
        Hostname: `${selector}._domainkey`,
        CNAME: `${selector}.domainkey.dabc123.domains.proton.ch.`,
        Key: null,
    })),
};

const buildDomain = (DomainName: string) => ({ DomainName, VerifyCode: VERIFY_CODE, DKIM });

const flatten = (records: DomainDnsRecords): DnsRecord[] => [
    records.verify,
    ...records.mx,
    records.spf,
    ...records.dkim,
    records.dmarc,
];

const getHostnames = (domainName: string) =>
    flatten(getDefaultDnsRecords(buildDomain(domainName))).map(({ hostname }) => hostname);

describe('getDefaultDnsRecords', () => {
    it('builds every record for an apex domain', () => {
        expect(getDefaultDnsRecords(buildDomain('example.com'))).toEqual({
            verify: { type: DnsRecordType.TXT, hostname: '@', value: VERIFY_CODE },
            mx: [
                { type: DnsRecordType.MX, hostname: '@', value: 'mail.protonmail.ch', priority: 10 },
                { type: DnsRecordType.MX, hostname: '@', value: 'mailsec.protonmail.ch', priority: 20 },
            ],
            spf: { type: DnsRecordType.TXT, hostname: '@', value: 'v=spf1 include:_spf.protonmail.ch ~all' },
            dkim: [
                {
                    type: DnsRecordType.CNAME,
                    hostname: 'protonmail._domainkey',
                    value: 'protonmail.domainkey.dabc123.domains.proton.ch.',
                },
                {
                    type: DnsRecordType.CNAME,
                    hostname: 'protonmail2._domainkey',
                    value: 'protonmail2.domainkey.dabc123.domains.proton.ch.',
                },
                {
                    type: DnsRecordType.CNAME,
                    hostname: 'protonmail3._domainkey',
                    value: 'protonmail3.domainkey.dabc123.domains.proton.ch.',
                },
            ],
            dmarc: { type: DnsRecordType.TXT, hostname: '_dmarc', value: 'v=DMARC1; p=quarantine' },
        });
    });

    it('suffixes every hostname with the subdomain and keeps values', () => {
        const apex = getDefaultDnsRecords(buildDomain('example.com'));
        const subdomain = getDefaultDnsRecords(buildDomain('mail.example.com'));

        expect(getHostnames('mail.example.com')).toEqual([
            'mail',
            'mail',
            'mail',
            'mail',
            'protonmail._domainkey.mail',
            'protonmail2._domainkey.mail',
            'protonmail3._domainkey.mail',
            '_dmarc.mail',
        ]);
        expect(flatten(subdomain).map(({ value }) => value)).toEqual(flatten(apex).map(({ value }) => value));
    });

    it('splits the subdomain off a public suffix domain', () => {
        expect(getHostnames('shop.example.co.uk')).toEqual([
            'shop',
            'shop',
            'shop',
            'shop',
            'protonmail._domainkey.shop',
            'protonmail2._domainkey.shop',
            'protonmail3._domainkey.shop',
            '_dmarc.shop',
        ]);
        expect(getHostnames('example.co.uk')).toEqual([
            '@',
            '@',
            '@',
            '@',
            'protonmail._domainkey',
            'protonmail2._domainkey',
            'protonmail3._domainkey',
            '_dmarc',
        ]);
    });

    it('keeps every label of a nested subdomain', () => {
        expect(getHostnames('a.b.example.com')).toEqual([
            'a.b',
            'a.b',
            'a.b',
            'a.b',
            'protonmail._domainkey.a.b',
            'protonmail2._domainkey.a.b',
            'protonmail3._domainkey.a.b',
            '_dmarc.a.b',
        ]);
    });

    it('falls back to no DKIM records and an empty verify value', () => {
        const records = getDefaultDnsRecords({ DomainName: 'example.com' });

        expect(records.dkim).toEqual([]);
        expect(records.verify).toEqual({ type: DnsRecordType.TXT, hostname: '@', value: '' });
    });

    it('appends cleaned, deduplicated SPF includes after the Proton include', () => {
        const records = getDefaultDnsRecords(buildDomain('example.com'), [
            'spf.example.com',
            ' ',
            '_spf.protonmail.ch',
            'spf.example.com',
            'mailgun.org',
        ]);

        expect(records.spf.value).toBe(
            'v=spf1 include:_spf.protonmail.ch include:spf.example.com include:mailgun.org ~all'
        );
    });
});

describe('applyZoneManagerOverrides', () => {
    it('passes each default hostname and the domain name to formatHostname', () => {
        const domainName = 'mail.example.com';
        const defaults = getDefaultDnsRecords(buildDomain(domainName));
        const formatHostname = vi.fn((hostname: string, name: string) => `${hostname}.${name}.`);

        const records = applyZoneManagerOverrides(defaults, domainName, { formatHostname });

        expect(formatHostname.mock.calls).toEqual(flatten(defaults).map(({ hostname }) => [hostname, domainName]));
        expect(flatten(records).map(({ hostname }) => hostname)).toEqual([
            'mail.mail.example.com.',
            'mail.mail.example.com.',
            'mail.mail.example.com.',
            'mail.mail.example.com.',
            'protonmail._domainkey.mail.mail.example.com.',
            'protonmail2._domainkey.mail.mail.example.com.',
            'protonmail3._domainkey.mail.mail.example.com.',
            '_dmarc.mail.mail.example.com.',
        ]);
    });

    it('passes the record with its formatted hostname to formatValue', () => {
        const defaults = getDefaultDnsRecords(buildDomain('example.com'));
        const formatValue = vi.fn(({ value }: DnsRecord) => value.replace(/\.$/, ''));

        const records = applyZoneManagerOverrides(defaults, 'example.com', {
            formatHostname: (hostname) => hostname.toUpperCase(),
            formatValue,
        });

        expect(formatValue).toHaveBeenCalledWith({
            type: DnsRecordType.CNAME,
            hostname: 'PROTONMAIL._DOMAINKEY',
            value: 'protonmail.domainkey.dabc123.domains.proton.ch.',
        });
        expect(records.dkim[0]).toEqual({
            type: DnsRecordType.CNAME,
            hostname: 'PROTONMAIL._DOMAINKEY',
            value: 'protonmail.domainkey.dabc123.domains.proton.ch',
        });
    });
});

describe('getDomainDnsRecords', () => {
    it('returns the defaults when no zone manager is given', () => {
        const domain = buildDomain('mail.example.com');

        expect(getDomainDnsRecords(domain)).toEqual(getDefaultDnsRecords(domain));
    });

    it.each(Object.values(ZoneManager))('asks %s to leave the zone apex hostname blank', (zoneManager) => {
        const domain = buildDomain('example.com');
        const defaults = getDefaultDnsRecords(domain);
        const blankApex = (record: DnsRecord) => ({ ...record, hostname: 'Leave field blank' });

        expect(getDomainDnsRecords(domain, { zoneManager })).toEqual({
            verify: blankApex(defaults.verify),
            mx: defaults.mx.map(blankApex),
            spf: blankApex(defaults.spf),
            dkim: defaults.dkim,
            dmarc: defaults.dmarc,
        });
    });

    it.each(Object.values(ZoneManager))('keeps every subdomain hostname for %s', (zoneManager) => {
        const domain = buildDomain('mail.example.com');

        expect(getDomainDnsRecords(domain, { zoneManager })).toEqual(getDefaultDnsRecords(domain));
    });
});

describe('getZoneManagerOverrides', () => {
    it('returns no overrides without a zone manager', () => {
        expect(getZoneManagerOverrides(undefined)).toEqual({});
    });
});
