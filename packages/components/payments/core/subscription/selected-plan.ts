import { type ADDON_NAMES, CYCLE, DEFAULT_CURRENCY, type FreeSubscription, PLANS } from '@proton/shared/lib/constants';
import {
    type AddonGuard,
    isDomainAddon,
    isIpAddon,
    isMemberAddon,
    isScribeAddon,
} from '@proton/shared/lib/helpers/addons';
import { getPlanFromIds } from '@proton/shared/lib/helpers/planIDs';
import { getIsB2BAudienceFromPlan, getMaxValue, getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import type { Currency, MaxKeys, Plan, PlanIDs, PlansMap, Subscription } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import isTruthy from '@proton/utils/isTruthy';

import { getScribeAddonNameByPlan } from './helpers';
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
        currency: Currency
    ): SelectedPlan {
        const plan = new SelectedPlan(planIDs, plans, cycle, currency);
        return plan.applyRules();
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

    getTotalMembers(): number {
        return this.getTotalAddons(isMemberAddon, 'MaxMembers');
    }

    getTotalIPs(): number {
        return this.getTotalAddons(isIpAddon, 'MaxIPs');
    }

    getTotalDomains(): number {
        return this.getTotalAddons(isDomainAddon, 'MaxDomains');
    }

    getTotalScribes(): number {
        return this.getTotalAddons(isScribeAddon, 'MaxAI');
    }

    getTotalByMaxKey(maxKey: MaxKeys): number {
        if (maxKey === 'MaxMembers') {
            return this.getTotalMembers();
        } else if (maxKey === 'MaxIPs') {
            return this.getTotalIPs();
        } else if (maxKey === 'MaxDomains') {
            return this.getTotalDomains();
        } else if (maxKey === 'MaxAI') {
            return this.getTotalScribes();
        } else {
            // Just count the respective maxKey in all the addons and plans
            return this.getTotalAddons(() => true, maxKey);
        }
    }

    setScribeCount(newCount: number): SelectedPlan {
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
        return updatedPlan.capScribes();
    }

    applyRules(): SelectedPlan {
        return this.capScribes();
    }

    getPlanName(): PLANS {
        return getPlanFromIds(this._planIDs) ?? PLANS.FREE;
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

    private capScribes(): SelectedPlan {
        if (this.getTotalMembers() < this.getTotalScribes()) {
            return this.setScribeCount(this.getTotalMembers());
        }

        return this;
    }

    private getTotalAddons(guard: AddonGuard, maxKey: MaxKeys): number {
        return this.getCountInPlan(maxKey) + this.getCountInAddons(guard, maxKey);
    }

    private getCountInPlan(maxKey: MaxKeys): number {
        return getMaxValue(this.getPlan(), maxKey);
    }

    private getCountInAddons(guard: AddonGuard, maxKey: MaxKeys): number {
        return this.getAddons(guard)
            .filter(isTruthy)
            .reduce((acc, addon) => {
                const addonCount = this.getPlanCount(addon.Name);
                return acc + getMaxValue(addon, maxKey) * addonCount;
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
