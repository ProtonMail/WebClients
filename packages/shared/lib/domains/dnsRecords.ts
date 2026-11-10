import { getSubdomain } from 'tldts';

import type { Domain } from '../interfaces/Domain';
import { ZONE_APEX } from './constants';
import type { ZoneManager, ZoneManagerOverrides } from './zoneManagers';
import { getZoneManagerOverrides } from './zoneManagers';

export enum DnsRecordType {
    TXT = 'TXT',
    MX = 'MX',
    CNAME = 'CNAME',
}

export interface DnsRecord {
    type: DnsRecordType;
    hostname: string;
    value: string;
    priority?: number;
}

export interface DomainDnsRecords {
    verify: DnsRecord;
    mx: DnsRecord[];
    spf: DnsRecord;
    dkim: DnsRecord[];
    dmarc: DnsRecord;
}

export interface DnsRecordsOptions {
    zoneManager?: ZoneManager;
    extraSpfIncludes?: string[];
}

type DnsRecordsDomain = Partial<Pick<Domain, 'DomainName' | 'VerifyCode' | 'DKIM'>>;

const MX_PRIMARY_HOST = 'mail.protonmail.ch';
const MX_SECONDARY_HOST = 'mailsec.protonmail.ch';
const PROTON_SPF_INCLUDE = '_spf.protonmail.ch';
const DMARC_HOSTNAME = '_dmarc';
const DEFAULT_DMARC_VALUE = 'v=DMARC1; p=quarantine';

const getZoneRelativeHostname = (name: string, subdomain: string) => {
    if (!subdomain) {
        return name;
    }
    if (name === ZONE_APEX) {
        return subdomain;
    }
    return `${name}.${subdomain}`;
};

const getSpfValue = (extraSpfIncludes: string[]) => {
    const extras = extraSpfIncludes
        .map((include) => include.trim())
        .filter((include) => include && include !== PROTON_SPF_INCLUDE);
    const includes = [PROTON_SPF_INCLUDE, ...new Set(extras)].map((include) => `include:${include}`);
    return ['v=spf1', ...includes, '~all'].join(' ');
};

export const getDefaultDnsRecords = (domain: DnsRecordsDomain, extraSpfIncludes: string[] = []): DomainDnsRecords => {
    const subdomain = getSubdomain(domain.DomainName ?? '') ?? '';
    const apexHostname = getZoneRelativeHostname(ZONE_APEX, subdomain);

    return {
        verify: { type: DnsRecordType.TXT, hostname: apexHostname, value: domain.VerifyCode ?? '' },
        mx: [
            { type: DnsRecordType.MX, hostname: apexHostname, value: MX_PRIMARY_HOST, priority: 10 },
            { type: DnsRecordType.MX, hostname: apexHostname, value: MX_SECONDARY_HOST, priority: 20 },
        ],
        spf: { type: DnsRecordType.TXT, hostname: apexHostname, value: getSpfValue(extraSpfIncludes) },
        dkim: (domain.DKIM?.Config ?? []).map(({ Hostname, CNAME }) => ({
            type: DnsRecordType.CNAME,
            hostname: getZoneRelativeHostname(Hostname, subdomain),
            value: CNAME,
        })),
        dmarc: {
            type: DnsRecordType.TXT,
            hostname: getZoneRelativeHostname(DMARC_HOSTNAME, subdomain),
            value: DEFAULT_DMARC_VALUE,
        },
    };
};

export const applyZoneManagerOverrides = (
    records: DomainDnsRecords,
    domainName: string,
    { formatHostname, formatValue }: ZoneManagerOverrides
): DomainDnsRecords => {
    const applyOverrides = (record: DnsRecord): DnsRecord => {
        const hostname = formatHostname ? formatHostname(record.hostname, domainName) : record.hostname;
        const withHostname = { ...record, hostname };
        return formatValue ? { ...withHostname, value: formatValue(withHostname) } : withHostname;
    };

    return {
        verify: applyOverrides(records.verify),
        mx: records.mx.map(applyOverrides),
        spf: applyOverrides(records.spf),
        dkim: records.dkim.map(applyOverrides),
        dmarc: applyOverrides(records.dmarc),
    };
};

export const getDomainDnsRecords = (
    domain: DnsRecordsDomain,
    { zoneManager, extraSpfIncludes }: DnsRecordsOptions = {}
): DomainDnsRecords =>
    applyZoneManagerOverrides(
        getDefaultDnsRecords(domain, extraSpfIncludes),
        domain.DomainName ?? '',
        getZoneManagerOverrides(zoneManager)
    );
