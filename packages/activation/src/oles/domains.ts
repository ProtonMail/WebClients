import { parse } from 'tldts';

import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

export const DEFAULT_REGISTRAR_ID = 0;

/**
 * Returns the subdomain portion of a domain name, or an empty string when the
 * value is a registrable (root) domain. Uses the public suffix list so that
 * country-code TLDs are handled correctly, e.g.
 *   getSubdomain('example.com')        -> ''
 *   getSubdomain('example.co.uk')      -> ''
 *   getSubdomain('mail.example.com')   -> 'mail'
 *   getSubdomain('mail.example.co.uk') -> 'mail'
 */
export const getSubdomain = (domainName: string | undefined): string =>
    (domainName ? parse(domainName).subdomain : '') ?? '';

/**
 * Composes the DNS "Host name" for a record given the domain's subdomain.
 * When there is no subdomain the base host is returned unchanged. Otherwise the
 * subdomain is prepended, and a blank base host becomes the subdomain itself:
 *   getRecordHost('', 'mail')                  -> 'mail'
 *   getRecordHost('_dmarc', 'mail')            -> '_dmarc.mail'
 *   getRecordHost('sel._domainkey', 'mail')    -> 'sel._domainkey.mail'
 *   getRecordHost('_dmarc', '')                -> '_dmarc'
 */
export const getRecordHost = (host: string | undefined, subdomain: string | undefined): string => {
    if (!subdomain) {
        return host ?? '';
    }
    return host ? `${host}.${subdomain}` : subdomain;
};

export const KNOWN_REGISTRARS = new Map<number, { name: string; url?: string }>([
    [1068, { name: 'Namecheap', url: getKnowledgeBaseUrl('/custom-domain-namecheap') }],
    [1910, { name: 'Cloudflare', url: getKnowledgeBaseUrl('/custom-domain-cloudflare') }],
    [1861, { name: 'Porkbun', url: getKnowledgeBaseUrl('/custom-domain-porkbun') }],
    [468, { name: 'Amazon', url: getKnowledgeBaseUrl('/custom-domain-aws') }],
    [4316, { name: 'Amazon', url: getKnowledgeBaseUrl('/custom-domain-aws') }],
    [1154, { name: 'Bluehost', url: getKnowledgeBaseUrl('/custom-domain-bluehost') }],
    [81, { name: 'Gandi', url: getKnowledgeBaseUrl('/custom-domain-gandi') }],
    [1696, { name: 'Hostpoint', url: getKnowledgeBaseUrl('/custom-domain-hostpoint') }],
    [433, { name: 'OVH', url: getKnowledgeBaseUrl('/custom-domain-ovh') }],
    [146, { name: 'GoDaddy', url: getKnowledgeBaseUrl('/custom-domain-godaddy') }],
    [1659, { name: 'GoDaddy', url: getKnowledgeBaseUrl('/custom-domain-godaddy') }],
    [3786, { name: 'GoDaddy', url: getKnowledgeBaseUrl('/custom-domain-godaddy') }],
    [895, { name: 'Squarespace', url: getKnowledgeBaseUrl('/custom-domain-squarespace') }],
    [3827, { name: 'Squarespace', url: getKnowledgeBaseUrl('/custom-domain-squarespace') }],
    [DEFAULT_REGISTRAR_ID, { name: 'Other', url: getKnowledgeBaseUrl('/mail/custom-email-domain') }],
]);

export const DEFAULT_REGISTRAR = KNOWN_REGISTRARS.get(DEFAULT_REGISTRAR_ID)!;

export const getRegistrarByIANAId = (id: number | undefined) => {
    if (id === undefined) {
        return undefined;
    }

    const details = KNOWN_REGISTRARS.get(id);
    if (!details) {
        return undefined;
    }

    return {
        id,
        ...details,
    };
};
