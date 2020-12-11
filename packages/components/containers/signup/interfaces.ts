import { HumanVerificationMethodType } from 'proton-shared/lib/interfaces';
import { APPS, ADDON_NAMES } from 'proton-shared/lib/constants';
import { SIGNUP_STEPS } from './constants';

export const SERVICES = {
    mail: APPS.PROTONMAIL,
    calendar: APPS.PROTONCALENDAR,
    contacts: APPS.PROTONCONTACTS,
    drive: APPS.PROTONDRIVE,
    vpn: APPS.PROTONVPN_SETTINGS,
};
export type SERVICES_KEYS = keyof typeof SERVICES;

export interface PlanIDs {
    [planID: string]: number;
}

export interface Additions {
    [ADDON_NAMES.ADDRESS]?: number;
    [ADDON_NAMES.DOMAIN]?: number;
    [ADDON_NAMES.MEMBER]?: number;
    [ADDON_NAMES.SPACE]?: number;
    [ADDON_NAMES.VPN]?: number;
}

export interface SubscriptionCheckResult {
    Amount: number;
    AmountDue: number;
    Proration: number;
    Credit: number;
    Currency: string;
    Cycle: number;
    Gift: number;
    CouponDiscount: number;
    Coupon: null | {
        Code: string;
        Description: string;
    };
    Additions: null | Additions;
    PeriodEnd: number;
}

export interface SignupModel {
    step: SIGNUP_STEPS;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    verifyMethods: string[];
    domains: string[];
    recoveryEmail: string;
    recoveryPhone: string;
    verificationCode: string;
    currency: string;
    cycle: number;
    planIDs: PlanIDs;
    humanVerificationMethods: HumanVerificationMethodType[];
    humanVerificationToken: string;
}

export interface SignupErrors {
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    recoveryEmail?: string;
    recoveryPhone?: string;
    verificationCode?: string;
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
