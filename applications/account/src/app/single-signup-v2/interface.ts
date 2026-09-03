import type { FunctionComponent, ReactNode } from 'react';

import type { LocationDescriptor } from 'history';

import type { SelectedProductPlans } from '@proton/components/containers/payments/subscription/PlanSelection';
import type { BillingAddressExtended } from '@proton/payments/core/billing-address/billing-address';
import type { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Currency, PaymentStatus, PlanIDs } from '@proton/payments/core/interface';
import type { FreePlanDefault, Plan, PlansMap, SubscriptionPlan } from '@proton/payments/core/plan/interface';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { ExtensionApp } from '@proton/shared/lib/browser/extension';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Audience, HumanVerificationMethodType } from '@proton/shared/lib/interfaces';

import type {
    InviteData,
    ReferralData,
    SessionData,
    SignupActionDoneResponse,
    SignupCacheResult,
    SignupInviteParameters,
    SignupType,
    SubscriptionData,
    UserCacheResult,
} from '../signup/interfaces';
import type { getSignupSearchParams } from '../signup/searchParams';
import type { SubscriptionDataCycleMapping } from './helper';
import type { TelemetryMeasurementData } from './measure';

interface RegularPlanCard {
    plan: PLANS;
    addons?: PlanIDs;
    subsection: ReactNode;
    type: 'best' | 'standard';
    guarantee: boolean;
    subline?: string;
    interactive?: never;
}

interface NonInteractivePlanCard {
    plan?: never;
    addons?: never;
    subsection: ReactNode;
    type: 'best' | 'standard';
    guarantee: boolean;
    subline?: string;
    interactive: false;
}

export type PlanCard = RegularPlanCard | NonInteractivePlanCard;

export function isRegularPlanCard(planCard: PlanCard): planCard is RegularPlanCard {
    return 'plan' in planCard;
}

export function isNonInteractivePlanCard(planCard: PlanCard): planCard is NonInteractivePlanCard {
    return planCard.interactive === false;
}

export type BaseMeasure<T> = (data: T) => Promise<void>;
export type Measure = BaseMeasure<TelemetryMeasurementData>;
export type OnOpenLogin = (data: { email: string; location: 'step2' | 'error_msg' }) => void;
export type OnOpenSwitch = () => void;
export type OnTriggerModals = (data: {
    session: SessionData;
    upsell: Upsell;
    subscriptionData: SubscriptionData;
    planParameters?: PlanParameters;
}) => void;

export interface OptimisticOptions {
    cycle: CYCLE;
    currency: Currency;
    planIDs: PlanIDs;
    billingAddress: BillingAddressExtended;
    checkResult: SubscriptionEstimation;
    coupon?: string;
    trial?: boolean;
    vatNumber?: string;
}

export const enum Steps {
    Account,
    Loading,
    Custom,
    SetupOrg,
}

type SubscriptionDataCycleMappingByCurrency = {
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
    paymentStatus: PaymentStatus;
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
    signupTokenMode?: boolean;
    loadingDependencies: boolean;
    disableCurrencySelector?: boolean;
    initialBillingAddress: BillingAddressExtended;
}

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
    billingAddress: BillingAddressExtended;
    skipUpsell?: boolean;
    trial?: boolean;
    ValidateBillingAddress?: boolean;
    VatId: string | undefined;
}

export interface Upsell {
    mode: UpsellTypes;
    plan: Plan | undefined;
    addons: PlanIDs | undefined;
    unlockPlan: Plan | undefined;
    currentPlan: SubscriptionPlan | undefined;
    subscriptionOptions: Partial<Options>;
}

export enum SignupMode {
    Default = 'default',
    Invite = 'invite',
    MailReferral = 'mailReferral',
    PassSimpleLogin = 'passSimpleLogin',
}

export interface SignupDefaults {
    plan: PLANS;
    addons?: PlanIDs;
    cycle: CYCLE;
}

export interface SignupCustomStepProps {
    product: APP_NAMES | undefined;
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
    features: { id: string; left: ReactNode; text: ReactNode }[];
    benefits: ReactNode;
    planCards: { [Audience.B2C]: PlanCard[]; [Audience.B2B]: PlanCard[] };
    audience: Audience.B2C | Audience.B2B;
    audiences?: { value: Audience; locationDescriptor: LocationDescriptor; title: string; defaultPlan: PLANS }[];
    generateMnemonic: boolean;
    defaults: SignupDefaults;
    product: APP_NAMES | undefined;
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

export interface SignupParameters2 extends Omit<ReturnType<typeof getSignupSearchParams>, 'invite' | 'trial'> {
    localID: number | undefined;
    mode: SignupMode;
    invite?: SignupInviteParameters;
    signIn?: 'standard' | 'redirect';
    trial?: boolean;
    visitorId: string | undefined;
}
