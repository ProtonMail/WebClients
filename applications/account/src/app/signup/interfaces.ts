import type { ChallengeResult, VerificationModel } from '@proton/components';
import type { AddressGeneration, AppIntent, AuthSession } from '@proton/components/containers/login/interface';
import type {
    BillingAddress,
    Currency,
    Cycle,
    ExtendedTokenPayment,
    FreeSubscription,
    PAYMENT_METHOD_TYPES,
    PlanIDs,
    SavedPaymentMethod,
    Subscription,
    SubscriptionEstimation,
} from '@proton/payments';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES, CLIENT_TYPES } from '@proton/shared/lib/constants';
import type {
    Address,
    Api,
    HumanVerificationMethodType,
    KeyTransparencyActivation,
    Organization,
    User,
} from '@proton/shared/lib/interfaces';

import type { DeferredMnemonicData } from '../containers/recoveryPhrase/types';

export interface SessionData {
    resumedSessionResult: ResumedSessionResult;
    paymentMethods: SavedPaymentMethod[] | undefined;
    defaultPaymentMethod: PAYMENT_METHOD_TYPES | undefined;
    subscription: Subscription | FreeSubscription | undefined;
    organization: Organization | undefined;
    state: {
        payable: boolean;
        admin: boolean;
        subscribed: boolean;
        access: boolean;
        /**
         * If true then the current plan can't be purchased by the user
         */
        unavailable: boolean;
    };
}

export interface SubscriptionData {
    currency: Currency;
    cycle: Cycle;
    minimumCycle?: Cycle;
    skipUpsell?: boolean;
    planIDs: PlanIDs;
    checkResult: SubscriptionEstimation;
    payment?: ExtendedTokenPayment;
    type?: 'cc' | 'pp' | 'btc';
    billingAddress: BillingAddress;
    zipCodeValid: boolean;
    vatNumber?: string;
}

export interface ReferralData {
    invite: string;
    referrer: string;
}

export enum SignupType {
    External = 1,
    Proton = 2,
    BringYourOwnEmail = 3,
}

export type SignupInviteParameters =
    | { type: 'generic'; data: { selector: string; token: string } }
    | { type: 'drive'; data: { invitee: string; externalInvitationID: string; preVerifiedAddressToken: string } }
    | { type: 'wallet'; data: { invitee: string; preVerifiedAddressToken: string } }
    | { type: 'pass'; data: { invitee: string; inviter?: string; preVerifiedAddressToken?: string } }
    | { type: 'mail'; data: { referrer: string; invite: string | undefined } }
    | { type: 'lumo'; data: { invitee: string; preVerifiedAddressToken?: string } }
    | { type: 'porkbun'; data: { invitee: string; preVerifiedAddressToken?: string; porkbunToken: string } };

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

export type AccountData = BaseAccountData & {
    signupType: SignupType;
};

interface SetupData {
    user: User;
    addresses: Address[];
    authResponse: AuthResponse;
    api: Api;
    mnemonicData?: DeferredMnemonicData;
    session: ResumedSessionResult;
}

interface UserData {
    User: User;
}

export interface UserCacheResult {
    type: 'user';
    setupData?: {
        mnemonicData?: DeferredMnemonicData;
    };
    subscriptionData: SubscriptionData;
    session: SessionData;
}

interface HumanVerificationResult {
    tokenType: HumanVerificationMethodType;
    token: string;
    verificationModel?: VerificationModel;
}

export interface SignupCacheResult {
    type: 'signup';
    appIntent?: AppIntent;
    productParam: ProductParam;
    userData?: UserData;
    setupData?: SetupData;
    accountData: AccountData;
    subscriptionData: SubscriptionData;
    subscription?: Subscription;
    ktActivation: KeyTransparencyActivation;
    appName: APP_NAMES;
    inviteData: InviteData | undefined;
    referralData: ReferralData | undefined;
    addressGeneration?: AddressGeneration;
    persistent: boolean;
    trusted: boolean;
    clientType: CLIENT_TYPES;
    ignoreExplore: boolean;
    humanVerificationInline?: boolean;
    humanVerificationResult?: HumanVerificationResult;
}

interface SignupActionContinueResponse {
    cache: SignupCacheResult;
}

export interface SignupActionDoneResponse {
    cache: SignupCacheResult;
    session: AuthSession;
}

export type SignupActionResponse = SignupActionDoneResponse | SignupActionContinueResponse;
