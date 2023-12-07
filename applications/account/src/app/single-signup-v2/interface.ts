import { FunctionComponent, Key, ReactNode } from 'react';

import { AuthSession } from '@proton/components/containers/login/interface';
import type { SelectedProductPlans } from '@proton/components/containers/payments/subscription/PlanSelection';
import type { PaymentMethodStatus } from '@proton/components/payments/core';
import type { APP_NAMES, CYCLE } from '@proton/shared/lib/constants';
import { PLANS } from '@proton/shared/lib/constants';
import type { RequiredCheckResponse } from '@proton/shared/lib/helpers/checkout';
import type {
    Currency,
    CycleMapping,
    HumanVerificationMethodType,
    Plan,
    PlanIDs,
    PlansMap,
} from '@proton/shared/lib/interfaces';
import { ThemeTypes } from '@proton/shared/lib/themes/themes';

import type {
    InviteData,
    ReferralData,
    SessionData,
    SignupActionDoneResponse,
    SubscriptionData,
    UserCacheResult,
} from '../signup/interfaces';
import { SignupCacheResult, SignupType } from '../signup/interfaces';
import { getSignupSearchParams } from '../signup/searchParams';
import { PlanCard } from './PlanCardSelector';
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
    SetupOrg,
}

export interface SubscriptionDataCycleMapping {
    planIDs: PlanIDs;
    mapping: CycleMapping<SubscriptionData>;
}

export interface SignupModelV2 {
    session: SessionData | undefined;
    inviteData: InviteData | undefined;
    referralData: ReferralData | undefined;
    subscriptionData: SubscriptionData;
    subscriptionDataCycleMapping: SubscriptionDataCycleMapping[];
    domains: string[];
    plans: Plan[];
    plansMap: PlansMap;
    paymentMethodStatus: PaymentMethodStatus;
    humanVerificationMethods: HumanVerificationMethodType[];
    humanVerificationToken: string;
    selectedProductPlans: SelectedProductPlans;
    optimistic: Partial<OptimisticOptions>;
    upsell: Upsell;
    planParameters?: PlanParameters;
    cache: SignupCacheResult | UserCacheResult | undefined;
    step: Steps;
    source?: string;
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

export interface Options {
    cycle: CYCLE;
    currency: Currency;
    coupon?: string;
    planIDs: PlanIDs | undefined;
}

export interface Upsell {
    mode: UpsellTypes;
    plan: Plan | undefined;
    unlockPlan: Plan | undefined;
    currentPlan: Plan | undefined;
    subscriptionOptions: Partial<Options>;
}

export enum SignupMode {
    Default = 'default',
    Onboarding = 'onboarding',
    Invite = 'invite',
}

export interface SignupTheme {
    type?: ThemeTypes;
    background?: 'bf';
    intent: APP_NAMES | undefined;
}

export interface SignupDefaults {
    plan: PLANS;
    cycle: CYCLE;
}

export interface SignupCustomStepProps {
    theme: SignupTheme;
    logo: ReactNode;
    onSetup: (cache: { type: 'signup'; payload: SignupActionDoneResponse } | UserCacheResult) => Promise<void>;
    model: SignupModelV2;
    onChangeModel: (diff: Partial<SignupModelV2>) => void;
    fork: boolean;
    setupImg: ReactNode;
    productAppName: string;
    measure: Measure;
}

export interface SignupConfiguration {
    logo: ReactNode;
    title: ReactNode;
    signupTypes: SignupType[];
    onboarding: {
        user: boolean;
        signup: boolean;
    };
    features: { key: Key; left: ReactNode; text: ReactNode }[];
    benefits: ReactNode;
    planCards: PlanCard[];
    generateMnemonic: boolean;
    defaults: SignupDefaults;
    product: APP_NAMES;
    shortProductAppName: string;
    productAppName: string;
    setupImg: ReactNode;
    preload: ReactNode;
    CustomStep: FunctionComponent<SignupCustomStepProps>;
    cycles?: CYCLE[];
}

export interface PlanParameters {
    defined: boolean;
    planIDs: PlanIDs;
    plan: Plan;
}

export interface SignupParameters2 extends Omit<ReturnType<typeof getSignupSearchParams>, 'invite'> {
    localID: number | undefined;
    mode: SignupMode;
    invite: { type: 'pass'; data: { inviter: string; invited: string } } | undefined;
}
