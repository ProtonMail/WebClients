import { CYCLE, PLANS } from '../core/constants';
import { PLANS_MAP, getLongTestPlans } from './data-plans';

export const mockPlans = getLongTestPlans('CHF');

const enum Steps {
    Account,
    Loading,
    Custom,
    SetupOrg,
}

enum SignupMode {
    Default = 'default',
    Invite = 'invite',
    MailReferral = 'mailReferral',
    PassSimpleLogin = 'passSimpleLogin',
}

export const createMockModel = (): any =>
    ({
        step: Steps.Account,
        subscriptionData: {
            planIDs: { [PLANS.PASS]: 1 },
            cycle: CYCLE.MONTHLY,
            currency: 'CHF',
            checkResult: {
                Amount: 499,
                AmountDue: 499,
                Proration: 0,
                CouponDiscount: 0,
                Gift: 0,
                Credit: 0,
                Coupon: null,
                Cycle: CYCLE.MONTHLY,
                TaxMode: 'TaxIncluded',
                Taxes: [],
                Currency: 'CHF',
                SubscriptionMode: 'Regular',
                BaseRenewAmount: 499,
                RenewCycle: CYCLE.MONTHLY,
                PeriodEnd: Date.now() / 1000 + 2592000,
                requestData: {
                    Plans: { [PLANS.PASS]: PLANS.PASS },
                    Currency: 'CHF',
                    Cycle: CYCLE.MONTHLY,
                },
            },
            billingAddress: { CountryCode: 'CH', State: '' },
            trial: undefined,
            vatNumber: undefined,
        },
        plans: mockPlans,
        plansMap: PLANS_MAP,
        subscriptionDataCycleMapping: {},
        optimistic: {},
        domains: [],
        planParameters: { planIDs: { [PLANS.PASS]: 1 } },
        session: null,
        cache: undefined,
        upsell: { currentPlan: undefined },
        paymentStatus: {
            VendorStates: {
                Card: false,
            },
        } as any,
        extension: { app: 'proton-pass', installed: false },
        loadingDependencies: false,
        freePlan: PLANS.FREE,
    }) as any;

export const createMockSignupConfiguration = (): any => ({
    logo: null,
    features: [],
    title: null,
    productAppName: 'Proton Pass',
    product: 'proton-pass',
    benefits: [],
    signupTypes: [1 as any],
    cycles: [CYCLE.MONTHLY, CYCLE.YEARLY],
    planCards: {
        [1]: [{ plan: PLANS.PASS, subsection: null, type: 'standard', guarantee: true }],
        [2]: [{ plan: PLANS.PASS, subsection: null, type: 'standard', guarantee: true }],
    } as any,
    audience: 1 as any,
    audiences: [1 as any],
    defaults: {
        plan: PLANS.PASS,
        cycle: CYCLE.MONTHLY,
    },
    generateMnemonic: true,
    onboarding: { signup: false, user: false },
    setupImg: null,
    preload: null,
    CustomStep: undefined as any,
    shortProductAppName: 'Pass',
});

export const createMockSignupParameters = (): any =>
    ({
        localID: undefined,
        mode: SignupMode.Default as any,
        invite: undefined,
        signIn: undefined,
        trial: false,
        visitorId: undefined,
    }) as any;
