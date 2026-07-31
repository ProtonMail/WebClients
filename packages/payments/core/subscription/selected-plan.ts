import isEqual from 'lodash/isEqual';

import isTruthy from '@proton/utils/isTruthy';

import {
    getAddonConfigByType,
    getAddonSeatGroup,
    getAddonTypeByFeatureLimitKey,
    getPerMemberCappedAddonTypes,
    getPreferredSeatPoolAddon,
    getSeatPoolAddonTypes,
    getSeatPoolGroups,
} from '../addon/addons';
import { ADDON_NAMES, ADDON_PREFIXES, CYCLE, PLANS } from '../constants';
import { getDefaultMainCurrency } from '../currencies';
import type { Currency, FeatureLimitKey, FreeSubscription, PlanIDs } from '../interface';
import { type AddonGuard, type SupportedAddons, getAddonType, getSupportedAddons, isAddonType } from '../plan/addons';
import { getPlanFeatureLimit } from '../plan/feature-limits';
import { getAddonNameByPlan, getIsB2BAudienceFromPlan, getPlanNameFromIDs } from '../plan/helpers';
import type { Plan, PlansMap } from '../plan/interface';
import { FREE_PLAN } from './freePlans';
import { getPlanIDs } from './helpers/plan-ids';
import type { Subscription } from './interface';
import { getPlansMap } from './plans-map-wrapper';

export class SelectedPlan {
    private _planIDs: PlanIDs;

    private _plansMap: PlansMap;

    public static createFromSubscription(
        subscription: Subscription | FreeSubscription | null | undefined,
        plans: PlansMap | Plan[]
    ): SelectedPlan {
        return new SelectedPlan(
            getPlanIDs(subscription),
            plans,
            subscription?.Cycle ?? CYCLE.MONTHLY,
            subscription?.Currency ?? getDefaultMainCurrency()
        );
    }

    public static createNormalized(
        planIDs: PlanIDs,
        plans: PlansMap | Plan[],
        cycle: CYCLE,
        currency: Currency,
        preferred?: ADDON_PREFIXES
    ): SelectedPlan {
        const plan = new SelectedPlan(planIDs, plans, cycle, currency);
        return plan.applyRules(preferred);
    }

    get planIDs(): PlanIDs {
        return { ...this._planIDs };
    }

    get cycle(): CYCLE {
        return this._cycle;
    }

    get currency(): Currency {
        return this._currency;
    }

    get isFree(): boolean {
        return this.getPlanName() === PLANS.FREE;
    }

    get isPaid(): boolean {
        return !this.isFree;
    }

    get name(): PLANS {
        return this.getPlanName();
    }

    constructor(
        planIDs: PlanIDs,
        plans: PlansMap | Plan[],
        private _cycle: CYCLE,
        private _currency: Currency
    ) {
        this._planIDs = { ...planIDs };

        if (Array.isArray(plans)) {
            this._plansMap = getPlansMap(plans, this.currency, false);
        } else {
            this._plansMap = plans;
        }
    }

    changePlan(toPlan: PLANS): SelectedPlan {
        const newPlanIDs: PlanIDs = {
            [toPlan]: 1,
        };
        for (const addonName of Object.values(ADDON_NAMES)) {
            if ((this.planIDs[addonName] ?? 0) > 0) {
                const newAddonName = this.swapAddonName(addonName, toPlan);
                if (newAddonName) {
                    newPlanIDs[newAddonName] = this.planIDs[addonName];
                }
            }
        }

        return SelectedPlan.createNormalized(newPlanIDs, this._plansMap, this._cycle, this._currency);
    }

    getSupportedAddons(): SupportedAddons {
        return getSupportedAddons(this.planIDs);
    }

    getSupportedAddonNames(): ADDON_NAMES[] {
        return Object.keys(this.getSupportedAddons()) as ADDON_NAMES[];
    }

    private swapAddonName(addonName: ADDON_NAMES, planName: PLANS): ADDON_NAMES | null {
        const addonType = getAddonType(addonName);
        if (!addonType) {
            return null;
        }

        const supportedAddons = getSupportedAddons({ [planName]: 1 });
        const supportedAddon = (Object.keys(supportedAddons) as ADDON_NAMES[]).find((addon) =>
            isAddonType(addon, addonType)
        );
        if (!supportedAddon) {
            return null;
        }

        return supportedAddon;
    }

    private getTotalMembers(): number {
        return this.getTotalAddons('MaxMembers', ADDON_PREFIXES.MEMBER);
    }

    /**
     * Unlike getTotalMembers(), this returns 1 if the user has no members.
     * `MaxMembers` is 0 for most of the plans that don't have accesss to mail. So for example if you have Drive Plus
     * then `MaxMembers` is 0 even though you do have 1 user.
     *
     * This fix is a bit simplistic because in theory there might be plans that have several members but `MaxMembers` is
     * still 0. But so far plans without Mail and with multiple users have their own non-zero `MaxMembers` value.
     * For example, passfamily2024 has MaxMembers == 6, and the VPN B2B plans have MaxMembers == 2. Watch out for the
     * new plans in the future that have multiple members but the backend returns MaxMembers == 0.
     */
    getTotalUsers(): number {
        return this.getTotalMembers() || 1;
    }

    getTotalIPs(): number {
        return this.getTotalAddons('MaxIPs', ADDON_PREFIXES.IP);
    }

    getIncludedIPs(): number {
        return this.getCountInPlan('MaxIPs');
    }

    getAdditionalIPs(): number {
        return this.getCountInAddons('MaxIPs', ADDON_PREFIXES.IP);
    }

    getTotalDomains(): number {
        return this.getTotalAddons('MaxDomains', ADDON_PREFIXES.DOMAIN);
    }

    getAdditionalDomains(): number {
        return this.getCountInAddons('MaxDomains', ADDON_PREFIXES.DOMAIN);
    }

    /**
     * Returns the entitelment number for the selected plan. It takes into account the numbers included both in the plan
     * and in the specified addons. For example, `MaxMembers` will return the total number of user seats the specified
     * planIDs.
     */
    getTotal(featureLimitKey: FeatureLimitKey): number {
        // Native plan limits keep their dedicated getters (they carry plan-specific nuance).
        switch (featureLimitKey) {
            case 'MaxMembers':
                return this.getTotalMembers();
            case 'MaxIPs':
                return this.getTotalIPs();
            case 'MaxDomains':
                return this.getTotalDomains();
            default: {
                // Synthetic/seat keys (MaxAI/MaxLumo/MaxMeet, …): resolve the owning addon type from
                // the registry and count generically. Falls back to counting across all addons.
                const addonType = getAddonTypeByFeatureLimitKey(featureLimitKey);
                return this.getTotalAddons(featureLimitKey, addonType);
            }
        }
    }

    setScribeCount(newCount: number, balance = true): SelectedPlan {
        return this.setAddonCount(ADDON_PREFIXES.SCRIBE, newCount, balance);
    }

    setLumoCount(newCount: number, balance = true): SelectedPlan {
        return this.setAddonCount(ADDON_PREFIXES.LUMO, newCount, balance);
    }

    setMeetCount(newCount: number): SelectedPlan {
        return this.setAddonCount(ADDON_PREFIXES.MEET, newCount);
    }

    setAddonCount(addonType: ADDON_PREFIXES, newCount: number, balance: boolean = false): SelectedPlan {
        const applied = this.applyAddonCount(addonType, newCount);
        if (applied === this) {
            return this;
        }

        const capped = applied.capAddonType(addonType);
        return balance ? capped.balanceSeatGroupFor(addonType) : capped;
    }

    // Adjusts the quantity of the addon backing `addonType` so the plan totals `newCount` of its feature.
    private applyAddonCount(addonType: ADDON_PREFIXES, newCount: number): SelectedPlan {
        const addonName = getAddonNameByPlan(addonType, this.getPlanName());
        const featureLimitKey = getAddonConfigByType(addonType)?.featureLimit.key;
        if (!addonName || !featureLimitKey) {
            return this;
        }

        const inPlan = this.getCountInPlan(featureLimitKey);
        const inAddons = this.getCountInAddons(featureLimitKey, addonType);
        const change = newCount - inPlan - inAddons;
        if (change === 0) {
            return this;
        }

        const planIDs = { ...this._planIDs };
        planIDs[addonName] = Math.max((planIDs[addonName] ?? 0) + change, 0);
        if (planIDs[addonName] === 0) {
            delete planIDs[addonName];
        }

        return this.selectedPlanWithNewIds(planIDs);
    }

    private applyRules(preferred?: ADDON_PREFIXES): SelectedPlan {
        let result: SelectedPlan = this;
        for (const addonType of getPerMemberCappedAddonTypes()) {
            result = result.capAddonType(addonType);
        }
        for (const group of getSeatPoolGroups()) {
            result = result.balanceSeatGroup(group, preferred);
        }
        return result;
    }

    getPlanName(): PLANS {
        return getPlanNameFromIDs(this._planIDs) ?? PLANS.FREE;
    }

    getPlan(): Plan {
        const planName = this.getPlanName();
        const plan = this._plansMap[planName];
        if (planName === PLANS.FREE || !plan) {
            return FREE_PLAN;
        }

        return plan;
    }

    isB2BPlan(): boolean {
        return getIsB2BAudienceFromPlan(this.getPlanName());
    }

    hasAddonType(addonType: ADDON_PREFIXES): boolean {
        const addonPrefixes = this.getAddonNames().map(getAddonType).filter(isTruthy);
        return addonPrefixes.includes(addonType);
    }

    isEqualTo(other: SelectedPlan): boolean {
        return isEqual(this.planIDs, other.planIDs);
    }

    // Member-capped addons (scribe, lumo, meet) can't exceed the user count. Drops stale addons from
    // other plans first, then trims the matching one down to the cap if still over.
    private capAddonType(addonType: ADDON_PREFIXES): SelectedPlan {
        //addons not related to user account can skip this capped logic
        if (![ADDON_PREFIXES.LUMO, ADDON_PREFIXES.SCRIBE, ADDON_PREFIXES.MEET].includes(addonType)) {
            return this;
        }

        const featureLimitKey = getAddonConfigByType(addonType)?.featureLimit.key;
        if (!featureLimitKey) {
            return this;
        }

        const max = this.getTotalUsers();
        if (this.getTotalAddons(featureLimitKey, addonType) <= max) {
            return this;
        }

        const trimmed = this.dropForeignAddons(addonType, getAddonNameByPlan(addonType, this.getPlanName()));
        if (trimmed.getTotalAddons(featureLimitKey, addonType) <= max) {
            return trimmed;
        }

        return trimmed.applyAddonCount(addonType, max);
    }

    private dropForeignAddons(
        expectedType: AddonGuard | ADDON_PREFIXES,
        matchingAddon: ADDON_NAMES | undefined
    ): SelectedPlan {
        const planIDs = { ...this._planIDs };
        let changed = false;
        for (const name of Object.keys(planIDs) as (ADDON_NAMES | PLANS)[]) {
            if (getAddonType(name) === expectedType && name !== matchingAddon) {
                delete planIDs[name];
                changed = true;
            }
        }
        return changed ? this.selectedPlanWithNewIds(planIDs) : this;
    }

    // Addons sharing a seat pool (e.g. scribe + lumo) can't total more than members. When over, trim
    // the non-preferred types; the preferred type is kept. `preferred` overrides the group's default
    // (the `pool.preferred` member) — e.g. interacting with the scribe customizer keeps scribes.
    private balanceSeatGroup(group: string, preferred?: ADDON_PREFIXES): SelectedPlan {
        const members = this.getTotalMembers();
        const addonPrefixes = getSeatPoolAddonTypes(group);
        const preferredType =
            preferred && addonPrefixes.includes(preferred) ? preferred : getPreferredSeatPoolAddon(group);

        const featureKeyOf = (addonType: ADDON_PREFIXES) => getAddonConfigByType(addonType)?.featureLimit.key;
        const total = addonPrefixes.reduce((acc, type) => {
            const key = featureKeyOf(type);
            return acc + (key ? this.getTotalAddons(key, type) : 0);
        }, 0);

        let difference = total - members;
        if (difference <= 0) {
            return this;
        }

        let result: SelectedPlan = this;
        for (const addonPrefix of addonPrefixes) {
            if (difference <= 0) {
                break;
            }
            if (addonPrefix === preferredType) {
                continue;
            }
            const key = featureKeyOf(addonPrefix);
            if (!key) {
                continue;
            }
            const current = result.getTotalAddons(key, addonPrefix);
            const reduceBy = Math.min(difference, current);
            result = result.applyAddonCount(addonPrefix, current - reduceBy).capAddonType(addonPrefix);
            difference -= reduceBy;
        }

        return result;
    }

    // Balances the seat group containing `addonType`, keeping that type.
    private balanceSeatGroupFor(addonType: ADDON_PREFIXES): SelectedPlan {
        const group = getAddonSeatGroup(addonType);
        if (!group) {
            return this;
        }
        return this.balanceSeatGroup(group, addonType);
    }

    private getTotalAddons(featureLimitKey: FeatureLimitKey, prefix?: ADDON_PREFIXES): number {
        return this.getCountInPlan(featureLimitKey) + this.getCountInAddons(featureLimitKey, prefix);
    }

    getCountInPlan(featureLimitKey: FeatureLimitKey): number {
        return getPlanFeatureLimit(this.getPlan(), featureLimitKey);
    }

    private getCountInAddons(featureLimitKey: FeatureLimitKey, prefix?: ADDON_PREFIXES): number {
        return this.getAddons(prefix)
            .filter(isTruthy)
            .reduce((acc, addon) => {
                const addonCount = this.getPlanCount(addon.Name);
                return acc + getPlanFeatureLimit(addon, featureLimitKey) * addonCount;
            }, 0);
    }

    private getAddons(prefix?: ADDON_PREFIXES): (Plan | undefined)[] {
        const allAddonNames = Object.keys(this._planIDs) as (ADDON_NAMES | PLANS)[];
        if (prefix === undefined) {
            return this.getPlansByNames(allAddonNames);
        }

        const filteredAddonNames = allAddonNames.filter((addonOrName) => getAddonType(addonOrName) === prefix);
        return this.getPlansByNames(filteredAddonNames);
    }

    private getAddonNames(guard: AddonGuard = () => true) {
        const keys = Object.keys(this._planIDs) as (ADDON_NAMES | PLANS)[];
        return keys.filter(guard);
    }

    private getPlansByNames(names: (ADDON_NAMES | PLANS)[]): (Plan | undefined)[] {
        return names.map((name) => this._plansMap[name] as Plan);
    }

    private getPlanCount(name: ADDON_NAMES | PLANS): number {
        return this._planIDs[name] ?? 0;
    }

    private selectedPlanWithNewIds(newPlanIDs: PlanIDs): SelectedPlan {
        return new SelectedPlan(newPlanIDs, this._plansMap, this._cycle, this._currency);
    }
}
