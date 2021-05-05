import { Currency, Cycle, HumanVerificationMethodType, SubscriptionCheckResponse } from 'proton-shared/lib/interfaces';
import { APPS } from 'proton-shared/lib/constants';

export enum SIGNUP_STEPS {
    NO_SIGNUP = 'no-signup',
    ACCOUNT_CREATION_USERNAME = 'account-creation-username',
    RECOVERY_EMAIL = 'recovery-email',
    RECOVERY_PHONE = 'recovery-phone',
    VERIFICATION_CODE = 'verification-code',
    CUSTOMISATION = 'customisation',
    PLANS = 'plans',
    PAYMENT = 'payment',
    HUMAN_VERIFICATION = 'human-verification',
    CREATING_ACCOUNT = 'creating-account',
    COMPLETE = 'complete',
}

export const SERVICES = {
    mail: APPS.PROTONMAIL,
    calendar: APPS.PROTONCALENDAR,
    drive: APPS.PROTONDRIVE,
    vpn: APPS.PROTONVPN_SETTINGS,
};
export type SERVICES_KEYS = keyof typeof SERVICES;

export interface PlanIDs {
    [planID: string]: number;
}

export interface SignupModel {
    step: SIGNUP_STEPS;
    stepHistory: SIGNUP_STEPS[];
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    signupType: 'email' | 'username';
    domains: string[];
    recoveryEmail: string;
    recoveryPhone: string;
    currency: Currency;
    cycle: Cycle;
    planIDs: PlanIDs;
    skipPlanStep?: boolean;
    humanVerificationMethods: HumanVerificationMethodType[];
    humanVerificationToken: string;
    checkResult: SubscriptionCheckResponse;
}

export interface SignupPayPal {
    isReady: boolean;
    loadingToken: boolean;
    loadingVerification: boolean;
    onToken: () => void;
    onVerification: () => void;
}

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
