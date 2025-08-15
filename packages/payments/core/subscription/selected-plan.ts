import isTruthy from '@proton/utils/isTruthy';

import { ADDON_NAMES, CYCLE, DEFAULT_CURRENCY, PLANS } from '../constants';
import type { Currency, FeatureLimitKey, FreeSubscription, PlanIDs } from '../interface';
import {
    type AddonGuard,
    getAddonType,
    getSupportedAddons,
    isAddonType,
    isDomainAddon,
    isIpAddon,
    isLumoAddon,
    isMemberAddon,
    isScribeAddon,
} from '../plan/addons';
import { getIsB2BAudienceFromPlan, getPlanNameFromIDs } from '../plan/helpers';
import { type Plan, type PlansMap } from '../plan/interface';
import { FREE_PLAN } from './freePlans';
import { getPlanFeatureLimit, getPlanIDs } from './helpers';
import { getLumoAddonNameByPlan, getScribeAddonNameByPlan } from './helpers';
import { type Subscription } from './interface';
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
            subscription?.Currency ?? DEFAULT_CURRENCY
        );
    }

    public static createNormalized(
        planIDs: PlanIDs,
        plans: PlansMap | Plan[],
        cycle: CYCLE,
        currency: Currency,
        preferred: 'prefer-scribes' | 'prefer-lumos' = 'prefer-lumos'
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

    getTotalMembers(): number {
        return this.getTotalAddons(isMemberAddon, 'MaxMembers');
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
        return this.getTotalAddons(isIpAddon, 'MaxIPs');
    }

    getIncludedIPs(): number {
        return this.getCountInPlan('MaxIPs');
    }

    getAdditionalIPs(): number {
        return this.getCountInAddons(isIpAddon, 'MaxIPs');
    }

    getTotalDomains(): number {
        return this.getTotalAddons(isDomainAddon, 'MaxDomains');
    }

    getTotalScribes(): number {
        return this.getTotalAddons(isScribeAddon, 'MaxAI');
    }

    getTotalLumos(): number {
        return this.getTotalAddons(isLumoAddon, 'MaxLumo');
    }

    /**
     * Returns the entitelment number for the selected plan. It takes into account the numbers included both in the plan
     * and in the specified addons. For example, `MaxMembers` will return the total number of user seats the specified
     * planIDs.
     */
    getTotal(featureLimitKey: FeatureLimitKey): number {
        switch (featureLimitKey) {
            case 'MaxMembers':
                return this.getTotalMembers();
            case 'MaxIPs':
                return this.getTotalIPs();
            case 'MaxDomains':
                return this.getTotalDomains();
            case 'MaxAI':
                return this.getTotalScribes();
            case 'MaxLumo':
                return this.getTotalLumos();
            default:
                // Just count the respective featureLimitKey in all the addons and plans
                return this.getTotalAddons(() => true, featureLimitKey);
        }
    }

    setScribeCount(newCount: number, balance = true): SelectedPlan {
        const scribeAddonName = getScribeAddonNameByPlan(this.getPlanName());
        if (!scribeAddonName) {
            return this;
        }

        const planIDs = { ...this._planIDs };

        const scribesInPlan = this.getCountInPlan('MaxAI');

        const scribesInAddons = this.getCountInAddons(isScribeAddon, 'MaxAI');
        const scribesChange = newCount - scribesInPlan - scribesInAddons;
        if (scribesChange === 0) {
            return this;
        }

        planIDs[scribeAddonName] = Math.max((planIDs[scribeAddonName] ?? 0) + scribesChange, 0);
        if (planIDs[scribeAddonName] === 0) {
            delete planIDs[scribeAddonName];
        }

        const updatedPlan = this.selectedPlanWithNewIds(planIDs);
        const result = updatedPlan.capScribes();
        if (balance) {
            return result.balanceScribesAndLumos('prefer-scribes');
        }

        return result;
    }

    setLumoCount(newCount: number, balance = true): SelectedPlan {
        const lumoAddonName = getLumoAddonNameByPlan(this.getPlanName());
        if (!lumoAddonName) {
            return this;
        }

        const planIDs = { ...this._planIDs };

        const lumosInPlan = this.getCountInPlan('MaxLumo');

        const lumosInAddons = this.getCountInAddons(isLumoAddon, 'MaxLumo');
        const lumosChange = newCount - lumosInPlan - lumosInAddons;
        if (lumosChange === 0) {
            return this;
        }

        planIDs[lumoAddonName] = Math.max((planIDs[lumoAddonName] ?? 0) + lumosChange, 0);
        if (planIDs[lumoAddonName] === 0) {
            delete planIDs[lumoAddonName];
        }

        const updatedPlan = this.selectedPlanWithNewIds(planIDs).capLumos();
        if (balance) {
            return updatedPlan.balanceScribesAndLumos('prefer-lumos');
        }

        return updatedPlan;
    }

    private applyRules(preferred: 'prefer-scribes' | 'prefer-lumos'): SelectedPlan {
        return this.capScribes().capLumos().balanceScribesAndLumos(preferred);
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

    getMaxLumos(): number {
        return this.getTotalUsers();
    }

    getMaxScribes(): number {
        return this.getTotalUsers();
    }

    private capScribes(): SelectedPlan {
        const maxScribes = this.getMaxScribes();
        if (this.getTotalScribes() > maxScribes) {
            return this.setScribeCount(maxScribes, false);
        }

        return this;
    }

    private capLumos(): SelectedPlan {
        const maxLumos = this.getMaxLumos();
        if (this.getTotalLumos() > maxLumos) {
            return this.setLumoCount(maxLumos, false);
        }

        return this;
    }

    private balanceScribesAndLumos(preferred: 'prefer-scribes' | 'prefer-lumos'): SelectedPlan {
        const members = this.getTotalMembers();
        const lumos = this.getTotalLumos();
        const scribes = this.getTotalScribes();

        const difference = lumos + scribes - members;

        if (difference > 0) {
            if (preferred === 'prefer-scribes') {
                // We prefer scribes over lumos, so we remove lumos
                return this.setLumoCount(lumos - difference, false);
            } else {
                // We prefer lumos over scribes, so we remove scribes
                return this.setScribeCount(scribes - difference, false);
            }
        }

        return this;
    }

    private getTotalAddons(guard: AddonGuard, featureLimitKey: FeatureLimitKey): number {
        return this.getCountInPlan(featureLimitKey) + this.getCountInAddons(guard, featureLimitKey);
    }

    private getCountInPlan(featureLimitKey: FeatureLimitKey): number {
        return getPlanFeatureLimit(this.getPlan(), featureLimitKey);
    }

    private getCountInAddons(guard: AddonGuard, featureLimitKey: FeatureLimitKey): number {
        return this.getAddons(guard)
            .filter(isTruthy)
            .reduce((acc, addon) => {
                const addonCount = this.getPlanCount(addon.Name);
                return acc + getPlanFeatureLimit(addon, featureLimitKey) * addonCount;
            }, 0);
    }

    private getAddons(guard: AddonGuard): (Plan | undefined)[] {
        const addonNames = this.getAddonNames(guard);
        return this.getPlansByNames(addonNames);
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
