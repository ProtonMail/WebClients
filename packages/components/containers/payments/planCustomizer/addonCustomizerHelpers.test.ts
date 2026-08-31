import {
    ADDON_NAMES,
    ADDON_PREFIXES,
    CYCLE,
    FREE_SUBSCRIPTION,
    PLANS,
    TRIAL_MAX_DEDICATED_IPS,
    TRIAL_MAX_EXTRA_CUSTOM_DOMAINS,
    TRIAL_MAX_SCRIBE_SEATS,
    TRIAL_MAX_USERS,
} from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
import { Renew } from '@proton/payments/core/subscription/constants';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { PLANS_MAP } from '@proton/payments/testing/data-plans';

import { computeAddonCustomizerItems, getAddonCustomizerProperties } from './addonCustomizerHelpers';

const onChangeMock = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── computeAddonCustomizerItems ─────────────────────────────────────────────

describe('computeAddonCustomizerItems', () => {
    const buildNormalizedPlan = (planIDs: PlanIDs) => {
        return SelectedPlan.createNormalized(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
    };

    const baseArgs = {
        plansMap: PLANS_MAP,
        cycle: CYCLE.MONTHLY as const,
        loading: false,
        latestSubscription: FREE_SUBSCRIPTION,
        isTrialMode: false,
        onChangePlanIDs: onChangeMock,
        addonFlags: {
            [ADDON_PREFIXES.SCRIBE]: true,
            [ADDON_PREFIXES.LUMO]: true,
        },
    };

    it('allowedAddonTypes filters to specified prefixes only', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.MAIL_PRO]: 1 }),
            addonFlags: { ...baseArgs.addonFlags, [ADDON_PREFIXES.SCRIBE]: true },
            allowedAddonTypes: [ADDON_PREFIXES.MEMBER],
            isSignup: false,
        });

        const addonNames = items.map((i) => i.addonName);
        expect(addonNames).toContain(ADDON_NAMES.MEMBER_MAIL_PRO);
        expect(addonNames).not.toContain(ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO);
    });

    it('allowedAddonTypes undefined shows all enabled addons', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.MAIL_PRO]: 1 }),
            addonFlags: { ...baseArgs.addonFlags, [ADDON_PREFIXES.SCRIBE]: true },
            isSignup: false,
        });

        const addonNames = items.map((i) => i.addonName);
        expect(addonNames).toContain(ADDON_NAMES.MEMBER_MAIL_PRO);
        expect(addonNames).toContain(ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO);
    });

    it('returns one item per included addon', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.MAIL_PRO]: 1 }),
            isSignup: false,
        });

        const addonNames = items.map((i) => i.addonName);
        expect(addonNames).toContain(ADDON_NAMES.MEMBER_MAIL_PRO);
        expect(addonNames).toContain(ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO);
    });

    it('excludes scribes when scribeAddonEnabled is false', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.MAIL_PRO]: 1 }),
            addonFlags: { ...baseArgs.addonFlags, [ADDON_PREFIXES.SCRIBE]: false },
            isSignup: false,
        });

        expect(items.map((i) => i.addonName)).not.toContain(ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO);
    });

    it('excludes lumo when lumoAddonEnabled is false', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.MAIL_PRO]: 1 }),
            addonFlags: { ...baseArgs.addonFlags, [ADDON_PREFIXES.LUMO]: false },
            isSignup: false,
        });

        expect(items.map((i) => i.addonName)).not.toContain(ADDON_NAMES.LUMO_MAIL_PRO);
    });

    it('includes meet addon when meetAddonEnabled is true', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.MAIL_PRO]: 1 }),
            addonFlags: { ...baseArgs.addonFlags, [ADDON_PREFIXES.MEET]: true },
            isSignup: false,
        });

        expect(items.map((i) => i.addonName)).toContain(ADDON_NAMES.MEET_MAIL_PRO);
    });

    it('each item has required fields', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.MAIL_PRO]: 1 }),
            isSignup: false,
        });

        for (const item of items) {
            expect(item).toHaveProperty('addonName');
            expect(item).toHaveProperty('memberCount');
            expect(item).toHaveProperty('sharedAddonCustomizerProps');
            expect(item).toHaveProperty('sharedAddonCustomizerProps.addon');
            expect(item).toHaveProperty('sharedAddonCustomizerProps.max');
        }
    });

    it('excludes DOMAIN_VPN_BUSINESS when domainAddonEnabled is false', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.VPN_BUSINESS]: 1 }),
            addonFlags: { ...baseArgs.addonFlags, [ADDON_PREFIXES.DOMAIN]: false },
            isSignup: false,
        });

        expect(items.map((i) => i.addonName)).not.toContain(ADDON_NAMES.DOMAIN_VPN_BUSINESS);
    });

    it('includes DOMAIN_VPN_BUSINESS when domainAddonEnabled is true', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.VPN_BUSINESS]: 1 }),
            addonFlags: { ...baseArgs.addonFlags, [ADDON_PREFIXES.DOMAIN]: true },
            isSignup: false,
        });

        expect(items.map((i) => i.addonName)).toContain(ADDON_NAMES.DOMAIN_VPN_BUSINESS);
    });

    it.each([
        { isSignup: false, shouldIncludeDomainAddon: true },
        { isSignup: true, shouldIncludeDomainAddon: false },
    ])('respects signup visibility for DOMAIN_VPN_BUSINESS', ({ isSignup, shouldIncludeDomainAddon }) => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.VPN_BUSINESS]: 1 }),
            latestSubscription: buildSubscription({
                [PLANS.VPN_BUSINESS]: 1,
                [ADDON_NAMES.DOMAIN_VPN_BUSINESS]: 1,
            }),
            isSignup,
        });

        const addonNames = items.map((item) => item.addonName);
        expect(addonNames.includes(ADDON_NAMES.DOMAIN_VPN_BUSINESS)).toBe(shouldIncludeDomainAddon);
    });
});

// ─── getAddonCustomizerProperties ────────────────────────────────────────────

describe('getAddonCustomizerProperties', () => {
    const buildSelectedPlan = (planIDs: PlanIDs) => {
        return SelectedPlan.createNormalized(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
    };

    it('returns current value as memberCount', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
        };
        const selectedPlan = buildSelectedPlan(planIDs);

        const { memberCount } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: {
                [ADDON_PREFIXES.SCRIBE]: true,
                [ADDON_PREFIXES.LUMO]: true,
            },
        });

        // 1 base member + 3 addon members = 4 total
        expect(memberCount).toBe(4);
    });

    it('caps max at total members for scribe addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 1, // 2 members total
        };
        const selectedPlan = buildSelectedPlan(planIDs);

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: {
                [ADDON_PREFIXES.SCRIBE]: true,
                [ADDON_PREFIXES.LUMO]: true,
            },
        });

        expect(sharedAddonCustomizerProps.max).toBe(2);
    });

    it('adds forbidden-modification decrease block when renewal is disabled and plan matches', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 2,
        };
        const subscription = buildSubscription(planIDs, { Renew: Renew.Disabled });
        const selectedPlan = buildSelectedPlan(planIDs);

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: subscription,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: {
                [ADDON_PREFIXES.SCRIBE]: true,
                [ADDON_PREFIXES.LUMO]: true,
            },
        });

        expect(sharedAddonCustomizerProps.decreaseBlockedReasons).toContain('forbidden-modification');
    });

    it('onChange syncs scribes with members when counts match', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 1, // 2 members total
            [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2, // scribes == members
        };
        const selectedPlan = buildSelectedPlan(planIDs);

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: { [ADDON_PREFIXES.SCRIBE]: true },
        });

        // Increase members from 2 → 3
        sharedAddonCustomizerProps.onChange?.(3);

        expect(onChangeMock).toHaveBeenCalledWith({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 2, // 3 total - 1 base
            [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 3, // synced to new member count
        });
    });

    it('onChange does not sync scribes when counts differ', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 2, // 3 members total
            [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 1, // scribes < members (no sync)
        };
        const selectedPlan = buildSelectedPlan(planIDs);

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: { [ADDON_PREFIXES.SCRIBE]: true },
        });

        sharedAddonCustomizerProps.onChange?.(4);

        expect(onChangeMock).toHaveBeenCalledWith({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
            [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 1, // unchanged
        });
    });

    it('onChange syncs lumos with members when counts match', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 1, // 2 members total
            [ADDON_NAMES.LUMO_MAIL_PRO]: 2, // lumos == members
        };
        const selectedPlan = buildSelectedPlan(planIDs);

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: { [ADDON_PREFIXES.LUMO]: true },
        });

        // Increase members from 2 → 3
        sharedAddonCustomizerProps.onChange?.(3);

        expect(onChangeMock).toHaveBeenCalledWith({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 2, // 3 total - 1 base
            [ADDON_NAMES.LUMO_MAIL_PRO]: 3, // synced to new member count
        });
    });

    it('onChange does not sync lumos when counts differ', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 2, // 3 members total
            [ADDON_NAMES.LUMO_MAIL_PRO]: 1, // lumos < members (no sync)
        };
        const selectedPlan = buildSelectedPlan(planIDs);

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: { [ADDON_PREFIXES.LUMO]: true },
        });

        sharedAddonCustomizerProps.onChange?.(4);

        expect(onChangeMock).toHaveBeenCalledWith({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 3,
            [ADDON_NAMES.LUMO_MAIL_PRO]: 1, // unchanged
        });
    });

    it('onChange always syncs meet with members when meet is active', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 1, // 2 members total
            [ADDON_NAMES.MEET_MAIL_PRO]: 1, // meet active but count != members
        };
        const selectedPlan = buildSelectedPlan(planIDs);

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: { [ADDON_PREFIXES.MEET]: true },
        });

        // Increase members from 2 → 3; meet must follow regardless of ratio
        sharedAddonCustomizerProps.onChange?.(3);

        expect(onChangeMock).toHaveBeenCalledWith({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 2, // 3 total - 1 base
            [ADDON_NAMES.MEET_MAIL_PRO]: 3, // always synced when active
        });
    });

    it('onChange does not sync meet when meet addon is absent', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 1, // 2 members, no meet
        };
        const selectedPlan = buildSelectedPlan(planIDs);

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: { [ADDON_PREFIXES.MEET]: true },
        });

        sharedAddonCustomizerProps.onChange?.(3);

        expect(onChangeMock).toHaveBeenCalledWith({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 2, // no meet key — was never active
        });
    });
});

// ─── trial mode ──────────────────────────────────────────────────────────────

describe('getAddonCustomizerProperties – non-trial mode', () => {
    const buildSelectedPlan = (planIDs: PlanIDs) => {
        return SelectedPlan.createNormalized(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
    };

    it('isTrialMode=false does not set trial-limit increase block', () => {
        const selectedPlan = buildSelectedPlan({ [PLANS.MAIL_PRO]: 1 });

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: {},
        });

        expect(sharedAddonCustomizerProps.increaseBlockedReasons).not.toContain('trial-limit');
        expect(sharedAddonCustomizerProps.increaseBlockedReasonText).toBeUndefined();
    });
});

describe('getAddonCustomizerProperties – trial mode', () => {
    const buildSelectedPlan = (planIDs: PlanIDs) => {
        return SelectedPlan.createNormalized(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
    };

    it('caps member addon at TRIAL_MAX_USERS', () => {
        const selectedPlan = buildSelectedPlan({ [PLANS.MAIL_PRO]: 1 });

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: true,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: {},
        });

        expect(sharedAddonCustomizerProps.max).toBe(TRIAL_MAX_USERS);
        expect(sharedAddonCustomizerProps.increaseBlockedReasons).toContain('trial-limit');
    });

    it('caps domain addon at TRIAL_MAX_EXTRA_CUSTOM_DOMAINS', () => {
        const selectedPlan = buildSelectedPlan({ [PLANS.BUNDLE_PRO_2024]: 1 });

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: true,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: {},
        });

        expect(sharedAddonCustomizerProps.max).toBe(TRIAL_MAX_EXTRA_CUSTOM_DOMAINS);
        expect(sharedAddonCustomizerProps.increaseBlockedReasons).toContain('trial-limit');
    });

    it('caps IP addon at TRIAL_MAX_DEDICATED_IPS', () => {
        const selectedPlan = buildSelectedPlan({ [PLANS.VPN_BUSINESS]: 1 });

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.IP_VPN_BUSINESS,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: true,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: {},
        });

        expect(sharedAddonCustomizerProps.max).toBe(TRIAL_MAX_DEDICATED_IPS);
        expect(sharedAddonCustomizerProps.increaseBlockedReasons).toContain('trial-limit');
    });

    it('caps scribe addon at TRIAL_MAX_SCRIBE_SEATS', () => {
        // Need enough members so the regular max (= total members) exceeds the trial cap
        const selectedPlan = buildSelectedPlan({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: TRIAL_MAX_SCRIBE_SEATS, // total = TRIAL_MAX_SCRIBE_SEATS + 1
        });

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: true,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: {},
        });

        expect(sharedAddonCustomizerProps.max).toBe(TRIAL_MAX_SCRIBE_SEATS);
        expect(sharedAddonCustomizerProps.increaseBlockedReasons).toContain('trial-limit');
    });

    it('trial max is the effective cap when lower than the uncapped computed max', () => {
        // Members can go well above TRIAL_MAX_USERS without a trial; the trial must win
        const selectedPlan = buildSelectedPlan({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 5, // 6 total — above trial cap
        });

        const { sharedAddonCustomizerProps: nonTrial } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: {},
        });

        const { sharedAddonCustomizerProps: withTrial } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: true,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: {},
        });

        expect(nonTrial.max).toBeGreaterThan(TRIAL_MAX_USERS);
        expect(withTrial.max).toBe(TRIAL_MAX_USERS);
    });
});

// ─── syncWhenEqualAddons (via getAddonCustomizerProperties) ───────────────────

describe('syncWhenEqualAddons', () => {
    const buildSelectedPlan = (planIDs: PlanIDs) => {
        return SelectedPlan.createNormalized(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
    };

    it('syncs the first matching when-equal addon and breaks (scribe wins over lumo)', () => {
        // Both scribes and lumos equal members — scribe config comes first in supported order
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 1, // 2 members
            [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2, // equals members
            [ADDON_NAMES.LUMO_MAIL_PRO]: 2, // equals members
        };
        const selectedPlan = buildSelectedPlan(planIDs);

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: { [ADDON_PREFIXES.SCRIBE]: true, [ADDON_PREFIXES.LUMO]: true },
        });

        sharedAddonCustomizerProps.onChange?.(3);

        const result = onChangeMock.mock.calls[0][0];
        // Only ONE of scribe or lumo should be synced, not both
        const scribeSynced = result[ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO] === 3;
        const lumoSynced = result[ADDON_NAMES.LUMO_MAIL_PRO] === 3;
        expect(scribeSynced !== lumoSynced).toBe(true);
    });

    it('does not sync when-equal addon when its flag is disabled', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 1, // 2 members
            [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2, // equals members
        };
        const selectedPlan = buildSelectedPlan(planIDs);

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: { [ADDON_PREFIXES.SCRIBE]: false },
        });

        sharedAddonCustomizerProps.onChange?.(3);

        expect(onChangeMock).toHaveBeenCalledWith({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 2,
            [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2, // unchanged — flag disabled
        });
    });
});

// ─── syncAlwaysAddons (via getAddonCustomizerProperties) ─────────────────────

describe('syncAlwaysAddons', () => {
    const buildSelectedPlan = (planIDs: PlanIDs) => {
        return SelectedPlan.createNormalized(planIDs, PLANS_MAP, CYCLE.MONTHLY, 'EUR');
    };

    it('does not sync meet when its quantity is 0', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 1, // 2 members
            [ADDON_NAMES.MEET_MAIL_PRO]: 0, // meet present but inactive
        };
        const selectedPlan = buildSelectedPlan(planIDs);

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: { [ADDON_PREFIXES.MEET]: true },
        });

        sharedAddonCustomizerProps.onChange?.(3);

        expect(onChangeMock).toHaveBeenCalledWith({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 2,
            [ADDON_NAMES.MEET_MAIL_PRO]: 0, // not synced — was inactive
        });
    });

    it('does not sync meet when its flag is disabled', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 1, // 2 members
            [ADDON_NAMES.MEET_MAIL_PRO]: 2, // meet active
        };
        const selectedPlan = buildSelectedPlan(planIDs);

        const { sharedAddonCustomizerProps } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: false,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            scribeToLumo: false,
            addonFlags: { [ADDON_PREFIXES.MEET]: false },
        });

        sharedAddonCustomizerProps.onChange?.(3);

        expect(onChangeMock).toHaveBeenCalledWith({
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 2,
            [ADDON_NAMES.MEET_MAIL_PRO]: 2, // unchanged — flag disabled
        });
    });
});
