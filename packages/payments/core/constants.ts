import { ADDON_PREFIXES } from '@proton/shared/lib/payments/constants';

export * from '@proton/shared/lib/payments/constants';

/**
 * Addons whose quantity can be set with a `total<Name>` URL search param (e.g. `?totalMember=5`).
 * MSP is provisioned, not user-selectable, so it can't be set this way.
 */
export type URL_CONFIGURABLE_ADDON_PREFIX = Exclude<ADDON_PREFIXES, ADDON_PREFIXES.MSP>;

export const ADDON_TOTAL_PARAM_NAMES = {
    [ADDON_PREFIXES.MEMBER]: 'Member',
    [ADDON_PREFIXES.DOMAIN]: 'Domain',
    [ADDON_PREFIXES.IP]: 'Ip',
    [ADDON_PREFIXES.SCRIBE]: 'Scribe',
    [ADDON_PREFIXES.LUMO]: 'Lumo',
    [ADDON_PREFIXES.MEET]: 'Meet',
} as const satisfies Record<URL_CONFIGURABLE_ADDON_PREFIX, string>;

export type ADDON_TOTAL_PARAM_NAME = (typeof ADDON_TOTAL_PARAM_NAMES)[keyof typeof ADDON_TOTAL_PARAM_NAMES];

export const URL_CONFIGURABLE_ADDON_PREFIXES = Object.keys(ADDON_TOTAL_PARAM_NAMES) as URL_CONFIGURABLE_ADDON_PREFIX[];
