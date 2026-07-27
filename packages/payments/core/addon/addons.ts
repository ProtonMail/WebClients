import type { PLANS } from '../constants';
import { ADDON_NAMES, ADDON_PREFIXES } from '../constants';
import type { FeatureLimitKey } from '../interface';
import { getAddonType, getSupportedAddons } from '../plan/addons';
import { DOMAIN_ADDON_CONFIG } from './configs/domainAddonConfig';
import { IP_ADDON_CONFIG } from './configs/ipAddonConfig';
import { LUMO_ADDON_CONFIG } from './configs/lumoAddonConfig';
import { MEET_ADDON_CONFIG } from './configs/meetAddonConfig';
import { MEMBER_ADDON_CONFIG } from './configs/memberAddonConfig';
import { SCRIBE_ADDON_CONFIG } from './configs/scribeAddonConfig';
import type { AddonConfig, AddonFlags } from './interfaces';

// Registering a new addon means adding its config here. A missing key fails to compile, so a new
// ADDON_PREFIXES member can't be forgotten. Insertion order is the render/registry order.
const ADDON_CONFIGS: Record<ADDON_PREFIXES, AddonConfig> = {
    [ADDON_PREFIXES.MEMBER]: MEMBER_ADDON_CONFIG,
    [ADDON_PREFIXES.DOMAIN]: DOMAIN_ADDON_CONFIG,
    [ADDON_PREFIXES.IP]: IP_ADDON_CONFIG,
    [ADDON_PREFIXES.SCRIBE]: SCRIBE_ADDON_CONFIG,
    [ADDON_PREFIXES.LUMO]: LUMO_ADDON_CONFIG,
    [ADDON_PREFIXES.MEET]: MEET_ADDON_CONFIG,
};

export const getAllAddonConfigs = (): AddonConfig[] => Object.values(ADDON_CONFIGS);

export const ALL_ADDON_PREFIXES = Object.values(ADDON_PREFIXES);
export const getAddonConfigsByPlanName = (plan: PLANS, addonFlags: AddonFlags): AddonConfig[] => {
    const supportedTypes = new Set((Object.keys(getSupportedAddons({ [plan]: 1 })) as ADDON_NAMES[]).map(getAddonType));
    return getAllAddonConfigs().filter(
        (c) => supportedTypes.has(c.addonType) && (c.alwaysOffered || !!addonFlags[c.addonType])
    );
};

export const getAddonConfigByType = (addonType: ADDON_PREFIXES | undefined | null): AddonConfig | undefined => {
    if (addonType === undefined || addonType === null) {
        return;
    }

    return ADDON_CONFIGS[addonType];
};

export const getAddonConfigByName = (addonName: ADDON_NAMES): AddonConfig | undefined => {
    return getAddonConfigByType(getAddonType(addonName));
};

export const getAddonFeatureLimitKey = (addonName: ADDON_NAMES): FeatureLimitKey | undefined => {
    return getAddonConfigByName(addonName)?.featureLimit.key;
};

const ADDON_TYPE_BY_FEATURE_LIMIT_KEY = new Map<FeatureLimitKey, ADDON_PREFIXES>(
    getAllAddonConfigs().map((config) => [config.featureLimit.key, config.addonType])
);

export const getAddonTypeByFeatureLimitKey = (key: FeatureLimitKey): ADDON_PREFIXES | undefined =>
    ADDON_TYPE_BY_FEATURE_LIMIT_KEY.get(key);

// Feature-limit keys the API does NOT report on plans — an addon fabricates them via its config's
// `featureLimit` (`kind: 'synthetic'`), as its own key or within `grants` (lumo grants MaxLumo + MaxAI).
const SYNTHETIC_FEATURE_LIMIT_KEYS = new Set<FeatureLimitKey>(
    getAllAddonConfigs().flatMap((config) =>
        config.featureLimit.kind === 'synthetic'
            ? [config.featureLimit.key, ...(Object.keys(config.featureLimit.grants) as FeatureLimitKey[])]
            : []
    )
);

/** Whether a feature-limit key is fabricated by an addon config rather than reported by the API. */
export const isSyntheticFeatureLimitKey = (key: FeatureLimitKey): boolean => SYNTHETIC_FEATURE_LIMIT_KEYS.has(key);

// How much one unit of this addon grants of `key`.
const getAddonGrantPerUnit = (config: AddonConfig, key: FeatureLimitKey): number => {
    const featureLimit = config.featureLimit;
    if (featureLimit.kind === 'synthetic') {
        return featureLimit.grants[key] ?? 0;
    }
    return featureLimit.key === key ? 1 : 0;
};

/** Capacity of `key` a base plan bundles in (`includedByPlanOverride`), or null if none declares one. */
export const getPlanInclusionLimit = (planName: PLANS, key: FeatureLimitKey): number | null => {
    let total: number | null = null;
    for (const config of getAllAddonConfigs()) {
        const included = config.includedByPlanOverride?.[planName];
        const grant = getAddonGrantPerUnit(config, key);
        if (included === undefined || grant === 0) {
            continue;
        }
        total = (total ?? 0) + included * grant;
    }
    return total;
};

export const AddonFeatureLimitKeyMapping = Object.fromEntries(
    Object.values(ADDON_NAMES).map((name) => [name, getAddonFeatureLimitKey(name)])
) as Record<ADDON_NAMES, FeatureLimitKey>;

const toAddonPrefix = (
    addonType: ADDON_PREFIXES | ADDON_NAMES | undefined | null
): ADDON_PREFIXES | undefined | null => {
    if (addonType == null || ALL_ADDON_PREFIXES.includes(addonType as ADDON_PREFIXES)) {
        return addonType as ADDON_PREFIXES | undefined | null;
    }
    return getAddonType(addonType as ADDON_NAMES);
};

export const getAddonLimit = (addonType: ADDON_PREFIXES | ADDON_NAMES | undefined | null): number => {
    const featureLimit = getAddonConfigByType(toAddonPrefix(addonType))?.max;

    return featureLimit?.perOrganization ?? featureLimit?.perMember ?? 0;
};

export const getAddonTrialLimit = (addonType: ADDON_PREFIXES | undefined | null): number => {
    const trialLimit = getAddonConfigByType(addonType)?.maxTrial;

    return trialLimit?.perOrganization ?? trialLimit?.perMember ?? 0;
};

// Render order is owned by each addon's config (`displayOrder`). Lower renders first.
export const getAddonDisplayOrder = (addonType: ADDON_PREFIXES | null | undefined): number => {
    return getAddonConfigByType(addonType)?.displayOrder ?? Infinity;
};

/** Addon types that are capped at the member count (scribe, lumo, meet), in registry order. */
export const getPerMemberCappedAddonTypes = (): ADDON_PREFIXES[] =>
    getAllAddonConfigs()
        .filter((config) => config.isPerMemberCapped)
        .map((config) => config.addonType);

/** The shared seat-pool group an addon belongs to, if any (e.g. scribe & lumo => 'ai'). */
export const getAddonSeatGroup = (addonType: ADDON_PREFIXES | null | undefined): string | undefined => {
    const featureLimit = getAddonConfigByType(addonType)?.featureLimit;
    return featureLimit?.kind === 'synthetic' ? featureLimit.pool?.group : undefined;
};

/** Addon types sharing the given seat-pool group, in registry order. */
export const getSeatPoolAddonTypes = (group: string): ADDON_PREFIXES[] =>
    getAllAddonConfigs()
        .filter((config) => getAddonSeatGroup(config.addonType) === group)
        .map((config) => config.addonType);

/** All distinct seat-pool groups defined across the registry. */
export const getSeatPoolGroups = (): string[] => [
    ...new Set(getAllAddonConfigs().flatMap((config) => getAddonSeatGroup(config.addonType) ?? [])),
];

const isPreferredInPool = (addonType: ADDON_PREFIXES): boolean => {
    const featureLimit = getAddonConfigByType(addonType)?.featureLimit;
    return featureLimit?.kind === 'synthetic' && !!featureLimit.pool?.preferred;
};

/** The type kept by default when trimming a seat-pool group (its `pool.preferred` member), or undefined. */
export const getPreferredSeatPoolAddon = (group: string): ADDON_PREFIXES | undefined =>
    getSeatPoolAddonTypes(group).find(isPreferredInPool);

/**
 * Order in which addons are transferred across a plan switch (`switchPlan`), derived from the
 * registry. Base order is `displayOrder`; a seat-pool overlay then guarantees that within each
 * pool group the `preferred` type transfers before its non-preferred peers (e.g. lumo before
 * scribe — scribe subtracts the seats lumo already grants). Output-equivalent to the former
 * hand-ordered priority list (the only hard constraint is preferred-before-peer within a pool).
 */
export const getTransferOrder = (): ADDON_PREFIXES[] => {
    const order = getAllAddonConfigs()
        .map((config) => config.addonType)
        .sort((a, b) => getAddonDisplayOrder(a) - getAddonDisplayOrder(b));

    for (const group of getSeatPoolGroups()) {
        const slots = order
            .map((type, index) => ({ type, index }))
            .filter(({ type }) => getAddonSeatGroup(type) === group);
        const reordered = slots
            .map(({ type }) => type)
            .sort(
                (a, b) =>
                    Number(isPreferredInPool(b)) - Number(isPreferredInPool(a)) ||
                    getAddonDisplayOrder(a) - getAddonDisplayOrder(b)
            );
        slots.forEach(({ index }, i) => {
            order[index] = reordered[i];
        });
    }

    return order;
};
