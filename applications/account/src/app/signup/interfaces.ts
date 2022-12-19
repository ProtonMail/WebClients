import { ChallengeResult } from '@proton/components';
import { VerificationModel } from '@proton/components/containers/api/humanVerification/interface';
import { AppIntent, AuthSession } from '@proton/components/containers/login/interface';
import { Payment } from '@proton/components/containers/payments/interface';
import { SelectedProductPlans } from '@proton/components/containers/payments/subscription/PlanSelection';
import { PayPalHook } from '@proton/components/containers/payments/usePayPal';
import { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { APPS, APP_NAMES, CLIENT_TYPES } from '@proton/shared/lib/constants';
import {
    Address,
    Currency,
    Cycle,
    HumanVerificationMethodType,
    PaymentMethodStatus,
    Plan,
    SubscriptionCheckResponse,
    User,
} from '@proton/shared/lib/interfaces';

export enum SIGNUP_STEPS {
    NO_SIGNUP = 'no-signup',
    ACCOUNT_CREATION_USERNAME = 'account-creation-username',
    SAVE_RECOVERY = 'save-recovery',
    CONGRATULATIONS = 'congratulations',
    UPSELL = 'plans',
    PAYMENT = 'payment',
    HUMAN_VERIFICATION = 'human-verification',
    CREATING_ACCOUNT = 'creating-account',
    TRIAL_PLAN = 'trial-plan',
    EXPLORE = 'explore',
    DONE = 'done',
}

export const SERVICES: { [key: string]: APP_NAMES } = {
    mail: APPS.PROTONMAIL,
    calendar: APPS.PROTONCALENDAR,
    drive: APPS.PROTONDRIVE,
    vpn: APPS.PROTONVPN_SETTINGS,
};

export interface PlanIDs {
    [planID: string]: number;
}

export interface SubscriptionData {
    currency: Currency;
    cycle: Cycle;
    minimumCycle?: Cycle;
    skipUpsell: boolean;
    planIDs: PlanIDs;
    checkResult: SubscriptionCheckResponse;
    payment?: Payment;
}

export interface ReferralData {
    invite: string;
    referrer: string;
}

export enum SignupType {
    Email = 1,
    Username,
    VPN,
}

export interface SignupModel {
    inviteData: InviteData | undefined;
    referralData: ReferralData | undefined;
    subscriptionData: SubscriptionData;
    domains: string[];
    plans: Plan[];
    paymentMethodStatus: PaymentMethodStatus;
    humanVerificationMethods: HumanVerificationMethodType[];
    humanVerificationToken: string;
    selectedProductPlans: SelectedProductPlans;
}

export type SignupPayPal = PayPalHook;

export class HumanVerificationError extends Error {
    methods: HumanVerificationMethodType[];

    token: string;

    constructor(methods: HumanVerificationMethodType[], token: string) {
        super('HumanVerificationError');
        this.methods = methods;
        this.token = token;
        Object.setPrototypeOf(this, HumanVerificationError.prototype);
    }
}

export interface InviteData {
    selector: string;
    token: string;
}

interface BaseAccountData {
    username: string;
    domain: string;
    email: string;
    password: string;
    payload: ChallengeResult;
}

export type AccountData =
    | (BaseAccountData & {
          signupType: Exclude<SignupType, SignupType.VPN>;
      })
    | (BaseAccountData & {
          recoveryEmail: string;
          signupType: SignupType.VPN;
      });

export enum HumanVerificationTrigger {
    ExternalCheck,
    UserCreation,
}

export interface HumanVerificationData {
    title: string;
    methods: HumanVerificationMethodType[];
    token: string;
    trigger: HumanVerificationTrigger;
}

interface SetupData {
    user: User;
    addresses: Address[];
    keyPassword: string | undefined;
    authResponse: AuthResponse;
}

export interface UserData {
    User: User;
}

export interface SignupCacheResult {
    appIntent?: AppIntent;
    productParam: APP_NAMES | 'generic' | 'none' | undefined;
    userData?: UserData;
    setupData?: SetupData;
    accountData: AccountData;
    subscriptionData: SubscriptionData;
    inviteData: InviteData | undefined;
    referralData: ReferralData | undefined;
    persistent: boolean;
    trusted: boolean;
    generateKeys: boolean;
    clientType: CLIENT_TYPES;
    ignoreExplore: boolean;
    humanVerificationData?: HumanVerificationData;
    humanVerificationResult?: {
        tokenType: HumanVerificationMethodType;
        token: string;
        verificationModel?: VerificationModel;
    };
}

export type SignupActionResponse =
    | {
          to: SIGNUP_STEPS.DONE;
          session: AuthSession;
      }
    | {
          cache: SignupCacheResult;
          to: Exclude<SIGNUP_STEPS, SIGNUP_STEPS.DONE>;
      };
