import type { PlanIDs } from '@proton/payments';
import {
    ADDON_NAMES,
    CYCLE,
    FREE_SUBSCRIPTION,
    PLANS,
    Renew,
    TRIAL_MAX_DEDICATED_IPS,
    TRIAL_MAX_EXTRA_CUSTOM_DOMAINS,
    TRIAL_MAX_SCRIBE_SEATS,
    TRIAL_MAX_USERS,
} from '@proton/payments';
import { buildSubscription } from '@proton/testing/builders';
import { PLANS_MAP } from '@proton/testing/data';

import { computeAddonCustomizerItems, getAddonCustomizerProperties } from './addonCustomizerHelpers';

const onChangeMock = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── computeAddonCustomizerItems ─────────────────────────────────────────────

describe('computeAddonCustomizerItems', () => {
    const buildNormalizedPlan = (planIDs: PlanIDs) => {
        const { SelectedPlan } = jest.requireActual('@proton/payments');
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
            scribeAddonEnabled: true,
            lumoAddonEnabled: true,
            meetAddonEnabled: false,
        },
        domainVpnBiz2023Enabled: false,
        mode: undefined as 'signup' | undefined,
    };

    it('returns one item per included addon', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.MAIL_PRO]: 1 }),
        });

        const addonNames = items.map((i) => i.addonName);
        expect(addonNames).toContain(ADDON_NAMES.MEMBER_MAIL_PRO);
        expect(addonNames).toContain(ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO);
    });

    it('excludes scribes when scribeAddonEnabled is false', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.MAIL_PRO]: 1 }),
            addonFlags: { ...baseArgs.addonFlags, scribeAddonEnabled: false },
        });

        expect(items.map((i) => i.addonName)).not.toContain(ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO);
    });

    it('excludes lumo when lumoAddonEnabled is false', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.MAIL_PRO]: 1 }),
            addonFlags: { ...baseArgs.addonFlags, lumoAddonEnabled: false },
        });

        expect(items.map((i) => i.addonName)).not.toContain(ADDON_NAMES.LUMO_MAIL_PRO);
    });

    it('includes meet addon when meetAddonEnabled is true', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.MAIL_PRO]: 1 }),
            addonFlags: { ...baseArgs.addonFlags, meetAddonEnabled: true },
        });

        expect(items.map((i) => i.addonName)).toContain(ADDON_NAMES.MEET_MAIL_PRO);
    });

    it('each item has required fields', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.MAIL_PRO]: 1 }),
        });

        for (const item of items) {
            expect(item).toHaveProperty('addonName');
            expect(item).toHaveProperty('memberCount');
            expect(item).toHaveProperty('sharedAddonCustomizerProps');
            expect(item).toHaveProperty('sharedAddonCustomizerProps.addon');
            expect(item).toHaveProperty('sharedAddonCustomizerProps.max');
        }
    });

    it('excludes DOMAIN_VPN_BUSINESS when flag is false and subscription has no domain addons', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.VPN_BUSINESS]: 1 }),
            domainVpnBiz2023Enabled: false,
        });

        expect(items.map((i) => i.addonName)).not.toContain(ADDON_NAMES.DOMAIN_VPN_BUSINESS);
    });

    it('includes DOMAIN_VPN_BUSINESS when flag is true', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.VPN_BUSINESS]: 1 }),
            domainVpnBiz2023Enabled: true,
        });

        expect(items.map((i) => i.addonName)).toContain(ADDON_NAMES.DOMAIN_VPN_BUSINESS);
    });

    it('includes DOMAIN_VPN_BUSINESS (grandfathered) when latestSubscription has domain addons but selectedPlanIDs does not', () => {
        const latestPlanIDs: PlanIDs = {
            [PLANS.VPN_BUSINESS]: 1,
            [ADDON_NAMES.DOMAIN_VPN_BUSINESS]: 2,
        };

        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.VPN_BUSINESS]: 1 }),
            latestSubscription: buildSubscription(latestPlanIDs),
            domainVpnBiz2023Enabled: false,
        });

        expect(items.map((i) => i.addonName)).toContain(ADDON_NAMES.DOMAIN_VPN_BUSINESS);
    });

    it('excludes DOMAIN_VPN_BUSINESS in signup mode even when flag is true', () => {
        const items = computeAddonCustomizerItems({
            ...baseArgs,
            normalizedSelectedPlan: buildNormalizedPlan({ [PLANS.VPN_BUSINESS]: 1 }),
            domainVpnBiz2023Enabled: true,
            mode: 'signup',
        });

        expect(items.map((i) => i.addonName)).not.toContain(ADDON_NAMES.DOMAIN_VPN_BUSINESS);
    });
});

// ─── getAddonCustomizerProperties ────────────────────────────────────────────

describe('getAddonCustomizerProperties', () => {
    const buildSelectedPlan = (planIDs: PlanIDs) => {
        const { SelectedPlan } = jest.requireActual('@proton/payments');
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
            addonFlags: { scribeAddonEnabled: true, lumoAddonEnabled: true, meetAddonEnabled: false },
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
            addonFlags: { scribeAddonEnabled: true, lumoAddonEnabled: true, meetAddonEnabled: false },
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
            addonFlags: { scribeAddonEnabled: true, lumoAddonEnabled: true, meetAddonEnabled: false },
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
            addonFlags: { scribeAddonEnabled: true, lumoAddonEnabled: false, meetAddonEnabled: false },
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
            addonFlags: { scribeAddonEnabled: true, lumoAddonEnabled: false, meetAddonEnabled: false },
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
            addonFlags: { scribeAddonEnabled: false, lumoAddonEnabled: true, meetAddonEnabled: false },
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
            addonFlags: { scribeAddonEnabled: false, lumoAddonEnabled: true, meetAddonEnabled: false },
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
            addonFlags: { scribeAddonEnabled: false, lumoAddonEnabled: false, meetAddonEnabled: true },
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
            addonFlags: { scribeAddonEnabled: false, lumoAddonEnabled: false, meetAddonEnabled: true },
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
        const { SelectedPlan } = jest.requireActual('@proton/payments');
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
            addonFlags: {
                scribeAddonEnabled: false,
                lumoAddonEnabled: false,
                meetAddonEnabled: false,
            },
        });

        expect(sharedAddonCustomizerProps.increaseBlockedReasons).not.toContain('trial-limit');
        expect(sharedAddonCustomizerProps.increaseBlockedReasonText).toBeUndefined();
    });
});

describe('getAddonCustomizerProperties – trial mode', () => {
    const buildSelectedPlan = (planIDs: PlanIDs) => {
        const { SelectedPlan } = jest.requireActual('@proton/payments');
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
            addonFlags: {
                scribeAddonEnabled: false,
                lumoAddonEnabled: false,
                meetAddonEnabled: false,
            },
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
            addonFlags: {
                scribeAddonEnabled: false,
                lumoAddonEnabled: false,
                meetAddonEnabled: false,
            },
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
            addonFlags: {
                scribeAddonEnabled: false,
                lumoAddonEnabled: false,
                meetAddonEnabled: false,
            },
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
            addonFlags: {
                scribeAddonEnabled: false,
                lumoAddonEnabled: false,
                meetAddonEnabled: false,
            },
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
            addonFlags: {
                scribeAddonEnabled: false,
                lumoAddonEnabled: false,
                meetAddonEnabled: false,
            },
        });

        const { sharedAddonCustomizerProps: withTrial } = getAddonCustomizerProperties({
            addonName: ADDON_NAMES.MEMBER_MAIL_PRO,
            plansMap: PLANS_MAP,
            loading: false,
            latestSubscription: FREE_SUBSCRIPTION,
            isTrialMode: true,
            selectedPlan,
            onChangePlanIDs: onChangeMock,
            addonFlags: {
                scribeAddonEnabled: false,
                lumoAddonEnabled: false,
                meetAddonEnabled: false,
            },
        });

        expect(nonTrial.max).toBeGreaterThan(TRIAL_MAX_USERS);
        expect(withTrial.max).toBe(TRIAL_MAX_USERS);
    });
});
