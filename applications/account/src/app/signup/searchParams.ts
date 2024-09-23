import type { Location } from 'history';

import { getPlan, planToPlanIDs } from '@proton/payments';
import type { OtherProductParam, ProductParam } from '@proton/shared/lib/apps/product';
import { otherProductParamValues } from '@proton/shared/lib/apps/product';
import type { ADDON_NAMES, APP_NAMES } from '@proton/shared/lib/constants';
import {
    APPS,
    AddonLimit,
    CURRENCIES,
    MAX_DOMAIN_PRO_ADDON,
    MAX_IPS_ADDON,
    MAX_MEMBER_ADDON,
    PLANS,
    SSO_PATHS,
} from '@proton/shared/lib/constants';
import { getSupportedAddons, isDomainAddon, isIpAddon, isMemberAddon } from '@proton/shared/lib/helpers/addons';
import { getCookie } from '@proton/shared/lib/helpers/cookies';
import { getHas2023OfferCoupon, getPlanMaxIPs, getValidCycle } from '@proton/shared/lib/helpers/subscription';
import type { Currency, Plan } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { ThemeTypes } from '@proton/shared/lib/themes/themes';
import clamp from '@proton/utils/clamp';

import type { PlanParameters, SignupDefaults } from '../single-signup-v2/interface';
import { SERVICES } from './interfaces';

export const getProduct = (maybeProduct: string | undefined): APP_NAMES | undefined => {
    if (!maybeProduct) {
        return;
    }
    const directMatch = SERVICES[maybeProduct];
    if (directMatch) {
        return directMatch;
    }
    const partialMatch = Object.keys(SERVICES).find((service) => maybeProduct.startsWith(service));
    if (partialMatch) {
        return SERVICES[partialMatch];
    }
};

const getDefaultProductParam = (): 'generic' => {
    return 'generic';
};

const productParams = new Set(otherProductParamValues);

const getSanitisedProductParam = (value: string | undefined): OtherProductParam | undefined => {
    if (productParams.has(value as any)) {
        return value as OtherProductParam;
    }
};

export const getProductParam = (
    product: APP_NAMES | undefined,
    productParam: string | undefined
): ProductParam | undefined => {
    const sanitisedProductParam = getSanitisedProductParam(productParam);
    return product || sanitisedProductParam;
};

export const getProductParams = (pathname: string, searchParams: URLSearchParams) => {
    const maybeProductPathname = pathname.match(/\/([^/]*)/)?.[1];
    const maybeProductParam = (
        searchParams.get('service') ||
        searchParams.get('product') ||
        searchParams.get('app') ||
        undefined
    )
        ?.toLowerCase()
        ?.replace('proton-', '');

    let [product] = [maybeProductPathname, maybeProductParam].map((value) => getProduct(value)).filter(Boolean);
    let [productParam] = [maybeProductPathname, maybeProductParam]
        .map((value) => getProductParam(product, value))
        .filter(Boolean);

    productParam = productParam || getDefaultProductParam();

    if (productParam === 'business') {
        if ([PLANS.MAIL_PRO, PLANS.MAIL_BUSINESS].includes(searchParams.get('plan') as any)) {
            product = APPS.PROTONMAIL;
            productParam = APPS.PROTONMAIL;
        }
    }

    if (!product) {
        if (
            [PLANS.MAIL_PRO, PLANS.MAIL_BUSINESS, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024].includes(
                searchParams.get('plan') as any
            )
        ) {
            product = APPS.PROTONMAIL;
        }
    }

    return { product, productParam };
};

export const getSignupSearchParams = (
    pathname: string,
    searchParams: URLSearchParams,
    defaults?: Partial<SignupDefaults>
) => {
    const maybeCurrency = searchParams.get('currency')?.toUpperCase() as Currency | undefined;
    const currency = maybeCurrency && CURRENCIES.includes(maybeCurrency) ? maybeCurrency : undefined;

    const maybeCycle = Number(searchParams.get('billing')) || Number(searchParams.get('cycle'));
    const cycle = getValidCycle(maybeCycle);

    const maybeMinimumCycle = Number(searchParams.get('minimumCycle'));
    const minimumCycle = getValidCycle(maybeMinimumCycle);

    const maybeUsers = Number(searchParams.get('users'));
    const users = maybeUsers >= 1 && maybeUsers <= MAX_MEMBER_ADDON ? maybeUsers : undefined;
    const maybeDomains = Number(searchParams.get('domains'));
    const domains = maybeDomains >= 1 && maybeDomains <= MAX_DOMAIN_PRO_ADDON ? maybeDomains : undefined;
    const maybeIps = Number(searchParams.get('ips'));
    const ips = maybeIps >= 1 && maybeIps <= MAX_IPS_ADDON ? maybeIps : undefined;

    const { product } = getProductParams(pathname, searchParams);

    // plan is validated by comparing plans after it's loaded
    const maybePreSelectedPlan = searchParams.get('plan');

    const referrer = searchParams.get('referrer') || undefined; // referral ID
    const invite = searchParams.get('invite') || undefined;
    const coupon = searchParams.get('coupon')?.toUpperCase() || undefined;
    const type = searchParams.get('type') || undefined;
    const maybeHfp = searchParams.get('hfp');
    const hideFreePlan = ['true', '1'].includes(maybeHfp as any) || getCookie('offer') === 'bestdeal' || false;
    const email = searchParams.get('email') || undefined;
    const orgName = searchParams.get('orgName') || undefined;
    const source = searchParams.get('source') || undefined;
    const noPromo = searchParams.get('noPromo');

    return {
        email,
        coupon,
        currency,
        cycle: cycle || defaults?.cycle,
        minimumCycle,
        preSelectedPlan: maybePreSelectedPlan || defaults?.plan,
        product,
        users,
        noPromo: noPromo !== null && noPromo !== 'false' && noPromo !== '0',
        domains,
        ips,
        referrer,
        invite,
        type,
        hideFreePlan,
        orgName,
        source,
    };
};
export type SignupParameters = ReturnType<typeof getSignupSearchParams>;

export const getThemeFromLocation = (location: Location, searchParams: URLSearchParams) => {
    if (location.pathname === SSO_PATHS.PASS_SIGNUP || location.pathname === SSO_PATHS.MAIL_SIGNUP) {
        return { themeType: ThemeTypes.Storefront, className: 'signup-v2-account-gradient' };
    }
    if (
        location.pathname === SSO_PATHS.PASS_SIGNUP_B2B ||
        location.pathname === SSO_PATHS.MAIL_SIGNUP_B2B ||
        location.pathname === SSO_PATHS.DRIVE_SIGNUP_B2B ||
        location.pathname === SSO_PATHS.BUSINESS_SIGNUP
    ) {
        return {
            themeType: ThemeTypes.Storefront,
            className: 'ui-prominent signup-v2-account-gradient',
            isDarkBg: true,
        };
    }
    if (location.pathname === SSO_PATHS.WALLET_SIGNUP) {
        return { themeType: ThemeTypes.StorefrontWallet, className: 'signup-v2-account-gradient--wallet' };
    }
    const hasBFCoupon = getHas2023OfferCoupon(searchParams.get('coupon')?.toUpperCase());
    const hasVisionary = searchParams.get('plan')?.toLowerCase() === PLANS.VISIONARY;
    if (location.pathname.includes('signup') && (hasBFCoupon || hasVisionary)) {
        return { themeType: ThemeTypes.Carbon, className: '' };
    }
    return null;
};
export const getPlanIDsFromParams = (
    plans: Plan[],
    currency: Currency,
    signupParameters: {
        preSelectedPlan?: string;
        domains?: number;
        ips?: number;
        users?: number;
    },
    defaults: { plan: PLANS },
    flags: { showGatewaysForBundlePlan: boolean }
): PlanParameters => {
    const freePlanIDs = {};

    const defaultPlan =
        defaults.plan === FREE_PLAN.Name
            ? FREE_PLAN
            : (getPlan(plans, defaults.plan, currency, undefined, false) ?? FREE_PLAN);
    const defaultPlanIDs = planToPlanIDs(defaultPlan);

    const defaultResponse = {
        planIDs: defaultPlanIDs,
        plan: defaultPlan,
        defined: false,
    };

    if (!signupParameters.preSelectedPlan) {
        return defaultResponse;
    }

    if (signupParameters.preSelectedPlan === 'free') {
        return { planIDs: freePlanIDs, defined: true, plan: FREE_PLAN };
    }

    const plan = getPlan(plans, signupParameters.preSelectedPlan, currency, undefined, false);

    if (!plan) {
        return defaultResponse;
    }

    const planIDs = { [plan.Name]: 1 };
    const supportedAddons = getSupportedAddons(planIDs, flags);

    if (signupParameters.users !== undefined) {
        const usersAddon = plans.find(
            ({ Name }) => isMemberAddon(Name) && supportedAddons[Name as keyof typeof supportedAddons]
        );

        const clampedUsers = clamp(
            signupParameters.users,
            0,
            usersAddon ? AddonLimit[usersAddon.Name as ADDON_NAMES] : 0
        );
        const amount = clampedUsers - plan.MaxMembers;
        if (usersAddon && amount > 0) {
            planIDs[usersAddon.Name] = amount;
        }
    }

    if (signupParameters.domains !== undefined) {
        const domainsAddon = plans.find(
            ({ Name }) => isDomainAddon(Name) && supportedAddons[Name as keyof typeof supportedAddons]
        );
        const amount = signupParameters.domains - plan.MaxDomains;
        if (domainsAddon && amount > 0) {
            planIDs[domainsAddon.Name] = amount;
        }
    }

    if (signupParameters.ips !== undefined) {
        const ipsAddon = plans.find(
            ({ Name }) => isIpAddon(Name) && supportedAddons[Name as keyof typeof supportedAddons]
        );
        const amount = signupParameters.ips - (getPlanMaxIPs(plan) + (ipsAddon?.Quantity || 0));
        if (ipsAddon && amount > 0) {
            planIDs[ipsAddon.Name] = amount;
        }
    }

    return { planIDs, defined: true, plan };
};
