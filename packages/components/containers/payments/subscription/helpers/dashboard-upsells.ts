import { c } from 'ttag';

import { ButtonLikeProps } from '@proton/atoms/Button';
import { MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import {
    APPS,
    APP_NAMES,
    BRAND_NAME,
    CYCLE,
    DASHBOARD_UPSELL_PATHS,
    FAMILY_MAX_USERS,
    PLANS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { toMap } from '@proton/shared/lib/helpers/object';
import {
    getHasLegacyPlans,
    hasBundle,
    hasDrive,
    hasMail,
    hasMailPro,
    hasPassPlus,
    hasVPN,
    isTrial,
} from '@proton/shared/lib/helpers/subscription';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { Currency, Plan, Subscription } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { getNCalendarsFeature } from '../../features/calendar';
import { getStorageBoostFeatureB2B, getStorageFeature } from '../../features/drive';
import { getUsersFeature } from '../../features/highlights';
import { PlanCardFeatureDefinition } from '../../features/interface';
import {
    getB2BNDomainsFeature,
    getFoldersAndLabelsFeature,
    getNAddressesFeature,
    getNAddressesFeatureB2B,
    getNDomainsFeature,
} from '../../features/mail';
import { getProtonPassFeature } from '../../features/pass';
import { getShortPlan } from '../../features/plan';
import {
    getAdvancedVPNFeature,
    getB2BHighSpeedVPNConnectionsFeature,
    getHighSpeedVPNConnectionsFeature,
} from '../../features/vpn';
import { OpenSubscriptionModalCallback } from '../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../constants';

const cycle = CYCLE.TWO_YEARS;

export interface UpsellFeature extends Omit<PlanCardFeatureDefinition, 'status' | 'highlight' | 'included'> {
    status?: PlanCardFeatureDefinition['status'];
    included?: PlanCardFeatureDefinition['included'];
}

type MaybeUpsellFeature = UpsellFeature | undefined;

export type ButtonShape = ButtonLikeProps<'button'>['shape'];
export type ButtonColor = ButtonLikeProps<'button'>['color'];

export interface UpsellCta {
    label: string | string[];
    action: () => void;
    fullWidth?: boolean;
    shape?: ButtonShape;
    color?: ButtonColor;
}

interface Price {
    value: number;
    currency: Currency;
}

export interface Upsell {
    plan: PLANS;
    title: string;
    description: string;
    isRecommended?: boolean;
    features: UpsellFeature[];
    price: Price;
    onUpgrade: () => void;
    otherCtas: UpsellCta[];
    upsellRefLink?: string;
    isTrialEnding?: boolean;
}
type MaybeUpsell = Upsell | null;

type GetUpsellArgs = {
    plan: PLANS;
    plansMap: { [key in PLANS]: Plan };
    currency: Currency;
    app: APP_NAMES;
    upsellPath: DASHBOARD_UPSELL_PATHS;
} & Partial<Upsell>;

type GetPlanUpsellArgs = Omit<GetUpsellArgs, 'plan' | 'upsellPath' | 'otherCtas'> & {
    hasPaidMail?: boolean;
    hasVPN: boolean;
    openSubscriptionModal: OpenSubscriptionModalCallback;
};

const getUpsell = ({ plan, plansMap, currency, upsellPath, app, ...upsellFields }: GetUpsellArgs) => {
    const fullPlan = plansMap[plan];
    const shortPlan = getShortPlan(plan, plansMap);

    if (!shortPlan) {
        return null;
    }

    const upsellRefLink = getUpsellRefFromApp({
        app: APPS.PROTONACCOUNT,
        fromApp: app,
        feature: upsellPath,
        component: UPSELL_COMPONENT.BUTTON,
    });

    return {
        plan,
        title: upsellFields.isTrialEnding ? c('new_plans: Title').t`${shortPlan.title} Trial` : shortPlan.title,
        description: shortPlan.description,
        upsellRefLink,
        price: { value: (fullPlan.Pricing[cycle] || 0) / cycle, currency },
        features: (upsellFields.features ?? shortPlan.features).filter((item) => isTruthy(item)),
        onUpgrade: () => {},
        otherCtas: [],
        ...upsellFields,
    };
};

const getMailPlusUpsell = ({
    plansMap,
    openSubscriptionModal,
    isTrialEnding,
    ...rest
}: GetPlanUpsellArgs): MaybeUpsell => {
    const bundlePlan = plansMap[PLANS.MAIL];

    const features: MaybeUpsellFeature[] = [
        getStorageFeature(bundlePlan?.MaxSpace ?? 15),
        getNAddressesFeature({ n: 10 }),
        getNDomainsFeature({ n: 1 }),
        getFoldersAndLabelsFeature('unlimited'),
        getNCalendarsFeature(MAX_CALENDARS_PAID),
        getHighSpeedVPNConnectionsFeature(),
        getProtonPassFeature(),
    ];

    return getUpsell({
        plan: PLANS.MAIL,
        plansMap,
        upsellPath: DASHBOARD_UPSELL_PATHS.MAILPLUS,
        features: features.filter((item): item is UpsellFeature => isTruthy(item)),
        otherCtas: isTrialEnding
            ? [
                  {
                      label: c('new_plans: Action').t`Explore all ${BRAND_NAME} plans`,
                      color: 'norm',
                      shape: 'ghost',
                      action: () =>
                          openSubscriptionModal({
                              step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
                          }),
                  },
              ]
            : [],
        isTrialEnding,
        onUpgrade: () =>
            openSubscriptionModal({
                plan: PLANS.MAIL,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
            }),
        ...rest,
    });
};

const getDriveUpsell = ({ plansMap, openSubscriptionModal, ...rest }: GetPlanUpsellArgs): MaybeUpsell => {
    return getUpsell({
        plan: PLANS.DRIVE,
        plansMap,
        upsellPath: DASHBOARD_UPSELL_PATHS.DRIVE,
        onUpgrade: () =>
            openSubscriptionModal({
                cycle,
                plan: PLANS.DRIVE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
            }),
        ...rest,
    });
};

const getPassUpsell = ({ plansMap, openSubscriptionModal, ...rest }: GetPlanUpsellArgs): MaybeUpsell => {
    return getUpsell({
        plan: PLANS.PASS_PLUS,
        plansMap,
        upsellPath: DASHBOARD_UPSELL_PATHS.PASS,
        onUpgrade: () =>
            openSubscriptionModal({
                cycle,
                plan: PLANS.PASS_PLUS,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
            }),
        ...rest,
    });
};

/**
 * Upsell for Bundle (a.k.a Unlimited)
 */
const getBundleUpsell = ({
    plansMap,
    hasPaidMail,
    hasVPN,
    openSubscriptionModal,
    ...rest
}: GetPlanUpsellArgs): MaybeUpsell => {
    const bundlePlan = plansMap[PLANS.BUNDLE];

    const features: MaybeUpsellFeature[] = [
        getStorageFeature(bundlePlan?.MaxSpace ?? 500),
        getNAddressesFeature({ n: 15 }),
        getNDomainsFeature({ n: 3 }),
        getFoldersAndLabelsFeature('unlimited'),
        hasPaidMail ? undefined : getNCalendarsFeature(MAX_CALENDARS_PAID),
        hasVPN ? undefined : getHighSpeedVPNConnectionsFeature(),
        getProtonPassFeature(),
    ];

    return getUpsell({
        plan: PLANS.BUNDLE,
        plansMap,
        upsellPath: DASHBOARD_UPSELL_PATHS.UNLIMITED,
        features: features.filter((item): item is UpsellFeature => isTruthy(item)),
        onUpgrade: () =>
            openSubscriptionModal({
                cycle,
                plan: PLANS.BUNDLE,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
            }),
        ...rest,
    });
};

const getFamilyUpsell = ({
    plansMap,
    hasVPN,
    hasPaidMail,
    openSubscriptionModal,
    currency,
    app,
}: GetPlanUpsellArgs): MaybeUpsell => {
    const familyPlan = plansMap[PLANS.FAMILY];
    if (!familyPlan) {
        return null;
    }

    const features: MaybeUpsellFeature[] = [
        getStorageFeature(familyPlan.MaxSpace, { family: true }),
        getUsersFeature(FAMILY_MAX_USERS),
        getNAddressesFeature({ n: familyPlan.MaxAddresses, family: true }),
        getFoldersAndLabelsFeature('unlimited'),
        hasPaidMail ? undefined : getNCalendarsFeature(MAX_CALENDARS_PAID),
        hasVPN ? undefined : getHighSpeedVPNConnectionsFeature(),
        getProtonPassFeature(),
    ];

    return getUpsell({
        plan: PLANS.FAMILY,
        plansMap,
        currency,
        app,
        upsellPath: DASHBOARD_UPSELL_PATHS.FAMILY,
        features: features.filter((item): item is UpsellFeature => isTruthy(item)),
        onUpgrade: () =>
            openSubscriptionModal({
                cycle,
                plan: PLANS.FAMILY,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
            }),
    });
};

const getBundleProUpsell = ({ plansMap, openSubscriptionModal, ...rest }: GetPlanUpsellArgs): MaybeUpsell => {
    const bundleProPlan = plansMap[PLANS.BUNDLE_PRO];
    const businessStorage = humanSize(bundleProPlan?.MaxSpace ?? 500, undefined, undefined, 0);

    const features: UpsellFeature[] = [
        getStorageBoostFeatureB2B(businessStorage),
        getNAddressesFeatureB2B({ n: 5 }),
        getB2BNDomainsFeature(),
        getB2BHighSpeedVPNConnectionsFeature(),
        getAdvancedVPNFeature(),
    ];

    return getUpsell({
        plan: PLANS.BUNDLE_PRO,
        plansMap,
        features,
        upsellPath: DASHBOARD_UPSELL_PATHS.BUSINESS,
        onUpgrade: () =>
            openSubscriptionModal({
                cycle,
                plan: PLANS.BUNDLE_PRO,
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
            }),
        ...rest,
    });
};

const hasOnePlusSubscription = (subscription: Subscription) => {
    return hasMail(subscription) || hasDrive(subscription) || hasPassPlus(subscription) || hasVPN(subscription);
};

export const resolveUpsellsToDisplay = ({
    app,
    subscription,
    plans,
    canPay,
    isFree,
    ...rest
}: {
    app: APP_NAMES;
    currency: Currency;
    subscription?: Subscription;
    plans: Plan[];
    canPay?: boolean;
    isFree?: boolean;
    hasPaidMail?: boolean;
    openSubscriptionModal: OpenSubscriptionModalCallback;
}): Upsell[] => {
    const resolve = () => {
        if (!canPay || !subscription || getHasLegacyPlans(subscription)) {
            return [];
        }

        const upsellsPayload = {
            app,
            plansMap: toMap(plans, 'Name'),
            hasVPN: hasVPN(subscription),
            ...rest,
        };

        const hasMailFree = isFree && app === APPS.PROTONMAIL;
        const hasDriveFree = isFree && app === APPS.PROTONDRIVE;
        const hasPassFree = isFree && app === APPS.PROTONPASS;

        switch (true) {
            case Boolean(isTrial(subscription) && subscription.PeriodEnd):
                return [
                    getMailPlusUpsell({ ...upsellsPayload, isTrialEnding: true }),
                    getBundleUpsell({ ...upsellsPayload, isRecommended: true }),
                ];
            case Boolean(hasMailFree):
                return [
                    getMailPlusUpsell({ ...upsellsPayload }),
                    getBundleUpsell({ ...upsellsPayload, isRecommended: true }),
                ];
            case Boolean(hasDriveFree):
                return [getDriveUpsell(upsellsPayload)];
            case Boolean(hasPassFree):
                return [getPassUpsell(upsellsPayload)];
            case Boolean(isFree || hasOnePlusSubscription(subscription)):
                return [getBundleUpsell({ ...upsellsPayload, isRecommended: true }), getFamilyUpsell(upsellsPayload)];
            case hasBundle(subscription):
                return [getFamilyUpsell(upsellsPayload)];
            case hasMailPro(subscription):
                return [getBundleProUpsell(upsellsPayload)];
            default:
                return [];
        }
    };

    return resolve().filter((maybeUpsell): maybeUpsell is Upsell => isTruthy(maybeUpsell));
};
