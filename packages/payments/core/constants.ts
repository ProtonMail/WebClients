import { ADDON_PREFIXES } from '@proton/shared/lib/payments/constants';

export * from '@proton/shared/lib/payments/constants';

export const ADDON_GENERIC_NAMES = {
    [ADDON_PREFIXES.MEMBER]: 'Member',
    [ADDON_PREFIXES.DOMAIN]: 'Domain',
    [ADDON_PREFIXES.IP]: 'Ip',
    [ADDON_PREFIXES.SCRIBE]: 'Scribe',
    [ADDON_PREFIXES.LUMO]: 'Lumo',
    [ADDON_PREFIXES.MEET]: 'Meet',
} as const satisfies Record<ADDON_PREFIXES, string>;

export type ADDON_GENERIC_NAME = (typeof ADDON_GENERIC_NAMES)[keyof typeof ADDON_GENERIC_NAMES];
