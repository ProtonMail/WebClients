import { ADDON_NAMES, ADDON_PREFIXES, PLANS } from '../constants';
import { getAddonType, getPlansWithAddons, getSupportedAddons } from '../plan/addons';
import {
    ALL_ADDON_PREFIXES,
    getAddonConfigByName,
    getAddonConfigsByPlanName,
    getAddonDisplayOrder,
    getAddonFeatureLimitKey,
    getAddonTypeByFeatureLimitKey,
    getAllAddonConfigs,
    getPlanInclusionLimit,
    getTransferOrder,
    isSyntheticFeatureLimitKey,
} from './addons';
import type { AddonTransferStrategy } from './interfaces';

describe('getAddonConfigByName', () => {
    it('returns the correct config for a known member addon name', () => {
        const config = getAddonConfigByName(ADDON_NAMES.MEMBER_MAIL_PRO);
        expect(config).toBeDefined();
        expect(config?.addonType).toBe(ADDON_PREFIXES.MEMBER);
    });

    it('returns the correct config for a known scribe addon name', () => {
        const config = getAddonConfigByName(ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO);
        expect(config).toBeDefined();
        expect(config?.addonType).toBe(ADDON_PREFIXES.SCRIBE);
        expect(config?.syncWithMembersAddon).toBe('when-equal');
    });

    it('returns the correct config for a known lumo addon name', () => {
        const config = getAddonConfigByName(ADDON_NAMES.LUMO_MAIL_PRO);
        expect(config).toBeDefined();
        expect(config?.addonType).toBe(ADDON_PREFIXES.LUMO);
        expect(config?.syncWithMembersAddon).toBe('when-equal');
    });

    it('returns the correct config for a known meet addon name', () => {
        const config = getAddonConfigByName(ADDON_NAMES.MEET_MAIL_PRO);
        expect(config).toBeDefined();
        expect(config?.addonType).toBe(ADDON_PREFIXES.MEET);
        expect(config?.syncWithMembersAddon).toBe('always');
    });

    it('returns undefined for an unknown addon name', () => {
        // @ts-ignore
        const config = getAddonConfigByName('unknown-addon');
        expect(config).toBeUndefined();
    });
});

// ─── Config invariants (registry gate) ───────────────────────────────────────

describe('addon config invariants', () => {
    it('derives the expected feature-limit key for each addon type', () => {
        expect(getAddonFeatureLimitKey(ADDON_NAMES.MEMBER_MAIL_PRO)).toBe('MaxMembers');
        expect(getAddonFeatureLimitKey(ADDON_NAMES.DOMAIN_BUNDLE_PRO)).toBe('MaxDomains');
        expect(getAddonFeatureLimitKey(ADDON_NAMES.IP_BUNDLE_PRO)).toBe('MaxIPs');
        expect(getAddonFeatureLimitKey(ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO)).toBe('MaxAI');
        expect(getAddonFeatureLimitKey(ADDON_NAMES.LUMO_MAIL_PRO)).toBe('MaxLumo');
        expect(getAddonFeatureLimitKey(ADDON_NAMES.MEET_MAIL_PRO)).toBe('MaxMeet');
    });

    it('maps every addon name to a defined feature-limit key (totality)', () => {
        for (const addonName of Object.values(ADDON_NAMES)) {
            expect(getAddonFeatureLimitKey(addonName)).toBeDefined();
        }
    });

    it("every synthetic config's grants include its own feature-limit key", () => {
        for (const config of getAllAddonConfigs()) {
            if (config.featureLimit.kind === 'synthetic') {
                expect(config.featureLimit.grants[config.featureLimit.key]).toBeGreaterThan(0);
            }
        }
    });

    it('display order is unique and contiguous from 0', () => {
        const orders = getAllAddonConfigs()
            .map((c) => c.displayOrder)
            .sort((a, b) => a - b);
        expect(orders).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('assigns each addon type its expected transfer strategy', () => {
        const expectedTransferStrategies = {
            [ADDON_PREFIXES.MEMBER]: 'member',
            [ADDON_PREFIXES.DOMAIN]: 'domain',
            [ADDON_PREFIXES.IP]: 'subtract-included',
            [ADDON_PREFIXES.SCRIBE]: 'scribe',
            [ADDON_PREFIXES.LUMO]: 'lumo',
            [ADDON_PREFIXES.MEET]: 'meet',
        } satisfies Record<ADDON_PREFIXES, AddonTransferStrategy>;

        for (const config of getAllAddonConfigs()) {
            expect(config.transferStrategy).toBe(expectedTransferStrategies[config.addonType]);
        }
    });
});

// ─── getAddonConfigsByPlanName (P1) ──────────────────────────────────────────

describe('getAddonConfigsByPlanName', () => {
    const types = (plan: PLANS, flags = {}) => getAddonConfigsByPlanName(plan, flags).map((c) => c.addonType);

    it('includes always-on addons (member) unflagged, excludes flag-gated addons when their flag is off', () => {
        const result = types(PLANS.MAIL_PRO);
        expect(result).toContain(ADDON_PREFIXES.MEMBER);
        expect(result).not.toContain(ADDON_PREFIXES.SCRIBE);
        expect(result).not.toContain(ADDON_PREFIXES.LUMO);
        expect(result).not.toContain(ADDON_PREFIXES.MEET);
    });

    it('includes member and ip unflagged when both are available for the plan', () => {
        const result = types(PLANS.BUNDLE_PRO);
        expect(result).toContain(ADDON_PREFIXES.MEMBER);
        expect(result).toContain(ADDON_PREFIXES.IP);
    });

    it('includes a flag-gated addon once its flag is on (and it is available)', () => {
        expect(types(PLANS.MAIL_PRO, { [ADDON_PREFIXES.SCRIBE]: true })).toContain(ADDON_PREFIXES.SCRIBE);
    });

    it('does not include a flag-gated addon for a plan where it is unavailable, even if flagged on', () => {
        // domain is not available for MAIL_PRO
        expect(types(PLANS.MAIL_PRO, { [ADDON_PREFIXES.DOMAIN]: true })).not.toContain(ADDON_PREFIXES.DOMAIN);
    });

    it('derives availability from the addon-name convention (getSupportedAddons), for every plan', () => {
        const allFlagsOn = Object.fromEntries(ALL_ADDON_PREFIXES.map((p) => [p, true]));
        for (const plan of getPlansWithAddons()) {
            const fromConfig = new Set(types(plan, allFlagsOn));
            const fromNames = new Set(
                (Object.keys(getSupportedAddons({ [plan]: 1 })) as ADDON_NAMES[]).map(getAddonType)
            );
            expect(fromConfig).toEqual(fromNames);
        }
    });
});

// ─── getAddonDisplayOrder (P1) ───────────────────────────────────────────────

describe('getAddonDisplayOrder', () => {
    it('orders addon types per the registry: member < domain < ip < meet < scribe < lumo', () => {
        const order = [
            ADDON_PREFIXES.MEMBER,
            ADDON_PREFIXES.DOMAIN,
            ADDON_PREFIXES.IP,
            ADDON_PREFIXES.MEET,
            ADDON_PREFIXES.SCRIBE,
            ADDON_PREFIXES.LUMO,
        ].map(getAddonDisplayOrder);
        expect(order).toEqual([...order].sort((a, b) => a - b));
        expect(new Set(order).size).toBe(order.length);
    });

    it('returns Infinity for null/undefined', () => {
        expect(getAddonDisplayOrder(null)).toBe(Infinity);
        expect(getAddonDisplayOrder(undefined)).toBe(Infinity);
    });
});

describe('getTransferOrder', () => {
    it('is a permutation of every addon type', () => {
        const order = getTransferOrder();
        const all = getAllAddonConfigs().map((c) => c.addonType);
        expect([...order].sort()).toEqual([...all].sort());
        expect(new Set(order).size).toBe(order.length);
    });

    it('processes the preferred seat-pool type before its peers (lumo before scribe)', () => {
        const order = getTransferOrder();
        expect(order.indexOf(ADDON_PREFIXES.LUMO)).toBeLessThan(order.indexOf(ADDON_PREFIXES.SCRIBE));
    });

    it('processes the independent addons (member, domain, ip) ahead of the pooled ones', () => {
        const order = getTransferOrder();
        const lastIndependent = Math.max(
            order.indexOf(ADDON_PREFIXES.MEMBER),
            order.indexOf(ADDON_PREFIXES.DOMAIN),
            order.indexOf(ADDON_PREFIXES.IP)
        );
        const firstPooled = Math.min(order.indexOf(ADDON_PREFIXES.LUMO), order.indexOf(ADDON_PREFIXES.SCRIBE));
        expect(lastIndependent).toBeLessThan(firstPooled);
    });
});

describe('getAddonTypeByFeatureLimitKey', () => {
    it('maps each feature-limit key to its owning addon type', () => {
        expect(getAddonTypeByFeatureLimitKey('MaxMembers')).toBe(ADDON_PREFIXES.MEMBER);
        expect(getAddonTypeByFeatureLimitKey('MaxDomains')).toBe(ADDON_PREFIXES.DOMAIN);
        expect(getAddonTypeByFeatureLimitKey('MaxIPs')).toBe(ADDON_PREFIXES.IP);
        expect(getAddonTypeByFeatureLimitKey('MaxAI')).toBe(ADDON_PREFIXES.SCRIBE);
        expect(getAddonTypeByFeatureLimitKey('MaxLumo')).toBe(ADDON_PREFIXES.LUMO);
        expect(getAddonTypeByFeatureLimitKey('MaxMeet')).toBe(ADDON_PREFIXES.MEET);
    });

    it('returns undefined for a key no addon owns', () => {
        expect(getAddonTypeByFeatureLimitKey('MaxSpace')).toBeUndefined();
    });
});

describe('isSyntheticFeatureLimitKey', () => {
    it('is true for keys fabricated by a synthetic addon config', () => {
        expect(isSyntheticFeatureLimitKey('MaxIPs')).toBe(true);
        expect(isSyntheticFeatureLimitKey('MaxAI')).toBe(true);
        expect(isSyntheticFeatureLimitKey('MaxLumo')).toBe(true);
        expect(isSyntheticFeatureLimitKey('MaxMeet')).toBe(true);
    });

    it('is false for native keys the API reports directly', () => {
        expect(isSyntheticFeatureLimitKey('MaxMembers')).toBe(false);
        expect(isSyntheticFeatureLimitKey('MaxDomains')).toBe(false);
        expect(isSyntheticFeatureLimitKey('MaxSpace')).toBe(false);
        expect(isSyntheticFeatureLimitKey('MaxAddresses')).toBe(false);
    });

    it('matches exactly the synthetic keys declared in the registry', () => {
        const expected = new Set(
            getAllAddonConfigs().flatMap((config) =>
                config.featureLimit.kind === 'synthetic'
                    ? [config.featureLimit.key, ...Object.keys(config.featureLimit.grants)]
                    : []
            )
        );
        for (const key of expected) {
            expect(isSyntheticFeatureLimitKey(key as any)).toBe(true);
        }
    });
});

describe('getPlanInclusionLimit', () => {
    it('returns the capacity a base plan bundles in for a synthetic feature', () => {
        expect(getPlanInclusionLimit(PLANS.VPN_BUSINESS, 'MaxIPs')).toBe(1);
        expect(getPlanInclusionLimit(PLANS.LUMO, 'MaxLumo')).toBe(1);
        expect(getPlanInclusionLimit(PLANS.LUMO_BUSINESS, 'MaxLumo')).toBe(1);
    });

    it("expands a synthetic addon's grants (lumo grants MaxLumo + MaxAI)", () => {
        expect(getPlanInclusionLimit(PLANS.LUMO, 'MaxAI')).toBe(1);
        expect(getPlanInclusionLimit(PLANS.LUMO_BUSINESS, 'MaxAI')).toBe(1);
    });

    it('supports an explicit zero inclusion (FREE includes 0 members)', () => {
        expect(getPlanInclusionLimit(PLANS.FREE, 'MaxMembers')).toBe(0);
    });

    it('returns null when no addon config declares an inclusion for that plan + key', () => {
        expect(getPlanInclusionLimit(PLANS.MAIL, 'MaxIPs')).toBeNull();
        expect(getPlanInclusionLimit(PLANS.VPN_BUSINESS, 'MaxMembers')).toBeNull();
        expect(getPlanInclusionLimit(PLANS.FREE, 'MaxIPs')).toBeNull();
    });
});
