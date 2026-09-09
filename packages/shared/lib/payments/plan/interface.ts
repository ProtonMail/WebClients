import type { ADDON_NAMES, PLANS, PLAN_TYPES } from '../constants';
import type { Currency, Cycle, CycleMapping, Pricing } from '../interface';
import type { PlanState } from './constants';

export interface Offer {
    Name: string;
    StartTime: number;
    EndTime: number;
    Pricing: Partial<Pricing>;
}

export interface Plan {
    ID: string;
    ParentMetaPlanID: string;
    Type: PLAN_TYPES;
    Cycle: Cycle;
    Name: PLANS | ADDON_NAMES;
    Title: string;
    Currency: Currency;
    Amount: number;
    MaxDomains: number;
    MaxAddresses: number;
    MaxSpace: number;
    MaxCalendars: number;
    MaxMembers: number;
    MaxVPN: number;
    MaxTier: number;
    Services: number;
    Features: number;
    Quantity: number;
    Pricing: Pricing;
    DefaultPricing?: Pricing;
    PeriodEnd: CycleMapping<number>;
    State: PlanState;
    Offers: Offer[];
    Vendors?: any;
}

/**
 * The same as Plan but it can't be an addon.
 */
export interface StrictPlan extends Plan {
    Type: PLAN_TYPES.PLAN;
    Name: PLANS;
}

export interface Addon extends Plan {
    Type: PLAN_TYPES.ADDON;
    Name: ADDON_NAMES;
}

export interface FreePlanDefault extends Plan {
    Name: PLANS.FREE;
    Type: PLAN_TYPES.PLAN;
    MaxBaseSpace: number;
    MaxDriveSpace: number;
    MaxRewardSpace: number;
    MaxDriveRewardSpace: number;
    MaxBaseRewardSpace: number;
}

export interface SubscriptionPlan extends Omit<
    Plan,
    'ParentMetaPlanID' | 'PeriodEnd' | 'Pricing' | 'DefaultPricing' | 'Offers'
> {
    // TODO: improve
    Offer?: 'default' | string;
}

export type BasePlansMap<T extends Plan> = {
    [planName in PLANS | ADDON_NAMES]: T;
};

export type PlansMap = Partial<BasePlansMap<Plan>>;
