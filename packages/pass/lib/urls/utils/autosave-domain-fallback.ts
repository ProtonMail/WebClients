import { parse } from 'tldts';

import capitalize from '@proton/utils/capitalize';

import { MAX_ITEM_NAME_LENGTH } from '../../../constants';
import type { MaybeNull } from '../../../types/utils';
import type { ParsedUrl } from '../types';
import { parseUrl } from './parser';

/** Registrable domains where the meaningful brand lives in the subdomain. */
const PLATFORM_REGISTRABLE_DOMAINS = new Set(['atlassian.net']);

const formatDomainLabel = (label: string): string => {
    const trimmed = label.trim();
    if (!trimmed) return '';

    const normalized = trimmed.toLowerCase();
    if (normalized.startsWith('xn--')) return trimmed;

    return normalized
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => capitalize(part))
        .join(' ');
};

const getPlatformBrandLabel = ({ domain, hostname }: ParsedUrl): string | null => {
    if (!domain || !hostname || !PLATFORM_REGISTRABLE_DOMAINS.has(domain)) return null;
    if (hostname === domain) return null;

    const suffix = `.${domain}`;
    if (!hostname.endsWith(suffix)) return null;

    const prefix = hostname.slice(0, -suffix.length);
    const label = prefix.split('.').filter(Boolean).at(-1);
    if (!label || label === 'www') return null;

    return label;
};

const truncateItemName = (label: string): string => label.slice(0, MAX_ITEM_NAME_LENGTH);

export type PrivateSuffixAutosaveLabels = {
    tenant: string;
    platform: string;
};

/**
 * Labels for multi-tenant public-suffix hosts (e.g. `tenant.netlify.app`).
 * Standalone registrable domains use `parseUrl().displayName` only (company name).
 */
export const getPrivateSuffixAutosaveLabels = (url: string): MaybeNull<PrivateSuffixAutosaveLabels> => {
    const parsed = parseUrl(url);
    if (!parsed.isPrivate || !parsed.url) return null;

    /** Pass marks the tenant host as private; use ICANN-level parse for the platform brand (e.g. netlify). */
    const { subdomain, domainWithoutSuffix } = parse(parsed.hostname ?? '', {
        allowIcannDomains: true,
        allowPrivateDomains: false,
        detectIp: true,
    });

    const tenant = parsed.displayName ?? subdomain ?? null;
    const platform = domainWithoutSuffix ?? null;

    if (!tenant || !platform) return null;

    return { tenant, platform };
};

export const domainFallbackAutosaveSiteName = (url: string): string | null => {
    const parsed = parseUrl(url);
    const platformLabel = getPlatformBrandLabel(parsed);
    if (platformLabel) {
        const formatted = formatDomainLabel(platformLabel);
        if (formatted) return truncateItemName(formatted);
    }

    if (parsed.isPrivate) {
        const privateLabels = getPrivateSuffixAutosaveLabels(url);
        if (privateLabels) {
            const { tenant, platform } = privateLabels;
            const tenantLabel = formatDomainLabel(tenant);
            const platformLabelPart =
                tenant.toLowerCase() === platform.toLowerCase() ? '' : formatDomainLabel(platform);
            const combined = [tenantLabel, platformLabelPart].filter(Boolean).join(' ');
            if (combined) return truncateItemName(combined);
        }
    }

    /** Standalone site: registrable company name only (e.g. mail.google.com → Google). */
    const rawLabel = parsed.displayName ?? parsed.domain ?? parsed.hostname;
    if (rawLabel) {
        const formatted = formatDomainLabel(rawLabel);
        if (formatted) return truncateItemName(formatted);
    }

    return null;
};
