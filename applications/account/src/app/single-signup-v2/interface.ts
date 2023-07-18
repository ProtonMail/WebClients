import { AuthSession } from '@proton/components/containers/login/interface';
import type { SelectedProductPlans } from '@proton/components/containers/payments/subscription/PlanSelection';
import type { PaymentMethodStatus } from '@proton/components/payments/core';
import type { CYCLE } from '@proton/shared/lib/constants';
import type { RequiredCheckResponse } from '@proton/shared/lib/helpers/checkout';
import type { Currency, HumanVerificationMethodType, Plan, PlanIDs, PlansMap } from '@proton/shared/lib/interfaces';

import type { InviteData, ReferralData, SessionData, SubscriptionData, UserCacheResult } from '../signup/interfaces';
import { SignupCacheResult } from '../signup/interfaces';
import { TelemetryMeasurementData } from './measure';

export type BaseMeasure<T> = (data: T) => Promise<void>;
export type Measure = BaseMeasure<TelemetryMeasurementData>;
export type OnOpenLogin = (data: { email: string; location: 'step2' | 'error_msg' }) => void;

export interface OptimisticOptions {
    cycle: CYCLE;
    currency: Currency;
    plan: Plan;
    planIDs: PlanIDs;
    checkResult: RequiredCheckResponse;
}

export const enum Steps {
    Account,
    Loading,
    Custom,
}

export interface SignupModelV2 {
    session: SessionData | undefined;
    inviteData: InviteData | undefined;
    referralData: ReferralData | undefined;
    subscriptionData: SubscriptionData;
    domains: string[];
    plans: Plan[];
    plansMap: PlansMap;
    paymentMethodStatus: PaymentMethodStatus;
    humanVerificationMethods: HumanVerificationMethodType[];
    humanVerificationToken: string;
    selectedProductPlans: SelectedProductPlans;
    optimistic: Partial<OptimisticOptions>;
    upsell: Upsell;
    cache: SignupCacheResult | UserCacheResult | undefined;
    step: Steps;
    extension?: {
        ID: string;
        installed: boolean;
    };
}

export type ActionResponse =
    | {
          to: 'done';
          session: AuthSession;
      }
    | {
          to?: undefined;
          cache: SignupCacheResult;
      }
    | {
          to?: undefined;
          cache: UserCacheResult;
      };

export enum UpsellTypes {
    PLANS,
    UPSELL,
}

export interface Upsell {
    mode: UpsellTypes;
    plan: Plan | undefined;
    unlockPlan: Plan | undefined;
    currentPlan: Plan | undefined;
}

export enum SignupMode {
    Default = 'default',
    Onboarding = 'onboarding',
}
