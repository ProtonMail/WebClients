import type { FunctionComponent, Key, ReactNode } from 'react';

import type { LocationDescriptor } from 'history';

import type { AuthSession } from '@proton/components/containers/login/interface';
import type { SelectedProductPlans } from '@proton/components/containers/payments/subscription/PlanSelection';
import type { BillingAddress, PaymentMethodStatusExtended } from '@proton/payments';
import type { ExtensionApp } from '@proton/shared/lib/browser/extension';
import type { APP_NAMES, CYCLE } from '@proton/shared/lib/constants';
import type { PLANS } from '@proton/shared/lib/constants';
import type { RequiredCheckResponse } from '@proton/shared/lib/helpers/checkout';
import type {
    Audience,
    Currency,
    FreePlanDefault,
    HumanVerificationMethodType,
    Plan,
    PlanIDs,
    PlansMap,
    SubscriptionPlan,
    VPNServersCountData,
} from '@proton/shared/lib/interfaces';

import type {
    InviteData,
    ReferralData,
    SessionData,
    SignupActionDoneResponse,
    SignupInviteParameters,
    SubscriptionData,
    UserCacheResult,
} from '../signup/interfaces';
import type { SignupCacheResult, SignupType } from '../signup/interfaces';
import type { getSignupSearchParams } from '../signup/searchParams';
import type { PlanCard } from './PlanCardSelector';
import type { SubscriptionDataCycleMapping } from './helper';
import type { TelemetryMeasurementData } from './measure';

export type BaseMeasure<T> = (data: T) => Promise<void>;
export type Measure = BaseMeasure<TelemetryMeasurementData>;
export type OnOpenLogin = (data: { email: string; location: 'step2' | 'error_msg' }) => void;
export type OnOpenSwitch = () => void;

export interface OptimisticOptions {
    cycle: CYCLE;
    currency: Currency;
    planIDs: PlanIDs;
    billingAddress: BillingAddress;
    checkResult: RequiredCheckResponse;
    coupon?: string;
}

export const enum Steps {
    Account,
    Loading,
    Custom,
    SetupOrg,
}

export type SubscriptionDataCycleMappingByCurrency = {
    currency: Currency;
    mapping: SubscriptionDataCycleMapping;
}[];

export interface SignupModelV2 {
    freePlan: FreePlanDefault;
    session: SessionData | undefined;
    inviteData: InviteData | undefined;
    referralData: ReferralData | undefined;
    subscriptionData: SubscriptionData;
    subscriptionDataCycleMapping: SubscriptionDataCycleMapping;
    subscriptionDataCycleMappingByCurrency: SubscriptionDataCycleMappingByCurrency;
    domains: string[];
    plans: Plan[];
    plansMap: PlansMap;
    paymentMethodStatusExtended: PaymentMethodStatusExtended;
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
        app: ExtensionApp;
        installed: boolean;
    };
    vpnServersCountData: VPNServersCountData;
    signupTokenMode?: boolean;
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
    plansMap: PlansMap;
    planIDs: PlanIDs | undefined;
    billingAddress: BillingAddress;
    skipUpsell?: boolean;
}

export interface Upsell {
    mode: UpsellTypes;
    plan: Plan | undefined;
    unlockPlan: Plan | undefined;
    currentPlan: SubscriptionPlan | undefined;
    subscriptionOptions: Partial<Options>;
}

export enum SignupMode {
    Default = 'default',
    Onboarding = 'onboarding',
    Invite = 'invite',
    MailReferral = 'mailReferral',
}

export interface SignupDefaults {
    plan: PLANS;
    cycle: CYCLE;
}

export interface SignupCustomStepProps {
    product: APP_NAMES;
    signupParameters: SignupParameters2;
    audience?: Audience;
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
    planCards: { [Audience.B2C]: PlanCard[]; [Audience.B2B]: PlanCard[] };
    audience: Audience.B2C | Audience.B2B;
    audiences?: { value: Audience; locationDescriptor: LocationDescriptor; title: string; defaultPlan: PLANS }[];
    generateMnemonic: boolean;
    defaults: SignupDefaults;
    product: APP_NAMES;
    shortProductAppName: string;
    productAppName: string;
    setupImg: ReactNode;
    preload: ReactNode;
    CustomStep: FunctionComponent<SignupCustomStepProps>;
    cycles: CYCLE[];
}

export interface PlanParameters {
    defined: boolean;
    planIDs: PlanIDs;
    plan: Plan;
}

export interface SignupParameters2 extends Omit<ReturnType<typeof getSignupSearchParams>, 'invite'> {
    localID: number | undefined;
    mode: SignupMode;
    invite?: SignupInviteParameters;
    signIn?: 'standard' | 'redirect';
}
