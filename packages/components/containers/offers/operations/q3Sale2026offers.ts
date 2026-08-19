import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import {
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';

import kv40 from '../components/q3Sale2026/q3-sale-2026-kv-40.webp';
import kv50 from '../components/q3Sale2026/q3-sale-2026-kv-50.webp';
import type { OfferProduct } from '../helpers/getOfferProduct';

const Q3_SALE_2026_PREFIX = 'q3-sale-2026';

interface Q3Offer {
    ID: Q3Sale2026OfferId;
    featureCode: FeatureCode;
    ref: string;
    dealName: string;
    couponCode: COUPON_CODES;
    getRef?: (product: OfferProduct, currentPlan: string) => string;
    features?: (product: OfferProduct) => { name: string }[];
    title: () => string;
    modalImage: string;
}

// translator: offer headline, shown over the artwork and wrapped after the comma
const getFullPowerTitle = () => {
    return c('q3campaign2026: Title').t`One plan, full power`;
};

// translator: offer headline, shown over the artwork and wrapped after the comma
const getMorePowerTitle = () => {
    return c('q3campaign2026: Title').t`One plan, more power`;
};

// translator: offer headline, shown over the artwork and wrapped after the comma
const getMaxSavingsTitle = () => {
    return c('q3campaign2026: Title').t`One plan, max savings`;
};

// Each ordering needs its own context. The app names stay interpolated so they cannot be translated,
// but that makes every ordering collapse to the same `Premium ${0}, ${1}, ...` msgid, which
// i18n:validate rejects as a duplicate within one context. The context also tells the translator which
// app leads the list, which the positional placeholders alone do not.
const getPremiumApps = (product: OfferProduct) => {
    if (product === 'drive') {
        return c('q3campaign2026: Info, Drive first')
            .t`Premium ${DRIVE_SHORT_APP_NAME}, ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`;
    }

    if (product === 'calendar') {
        return c('q3campaign2026: Info, Calendar first')
            .t`Premium ${CALENDAR_SHORT_APP_NAME}, ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, and ${VPN_SHORT_APP_NAME}`;
    }

    return c('q3campaign2026: Info, Mail first')
        .t`Premium ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`;
};

// Family copy lists four apps and Calendar is not one of them, so a Calendar user keeps the default order.
const getFamilyPremiumApps = (product: OfferProduct) => {
    if (product === 'drive') {
        return c('q3campaign2026: Info, Family, Drive first')
            .t`Premium ${DRIVE_SHORT_APP_NAME}, ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}`;
    }

    return c('q3campaign2026: Info, Family, Mail first')
        .t`Premium ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}`;
};

const getUnlimitedFeatures = (product: OfferProduct) => {
    return [
        { name: getPremiumApps(product) },
        { name: c('q3campaign2026: Info').t`500 GB of secure storage` },
        { name: c('q3campaign2026: Info').t`Advanced protection against cyber threats` },
    ];
};

const freeToUnlimited: Q3Offer = {
    ID: `${Q3_SALE_2026_PREFIX}-free-to-unlimited`,
    featureCode: FeatureCode.OfferQ3Sale2026FreeToUnlimited,
    ref: 'offer_26_sep_free_unlimited_mail_web',
    getRef: (product, currentPlan) => `offer_26_sep_${currentPlan}_unlimited_${product}_web`,
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.SEP26BUNDLESALE,
    features: getUnlimitedFeatures,
    title: getFullPowerTitle,
    modalImage: kv50,
};

const plusToUnlimited: Q3Offer = {
    ID: `${Q3_SALE_2026_PREFIX}-plus-to-unlimited`,
    featureCode: FeatureCode.OfferQ3Sale2026PlusToUnlimited,
    ref: 'offer_26_sep_mail_plus_unlimited_mail_web',
    getRef: (product, currentPlan) => `offer_26_sep_${currentPlan}_unlimited_${product}_web`,
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.SEP26BUNDLESALE,
    features: getUnlimitedFeatures,
    title: getFullPowerTitle,
    modalImage: kv50,
};

const getDuoFeatures = (product: OfferProduct) => {
    return [
        { name: getPremiumApps(product) },
        { name: c('q3campaign2026: Info').t`2 individual accounts` },
        { name: c('q3campaign2026: Info').t`2 TB of secure storage` },
    ];
};

const unlimitedToDuo: Q3Offer = {
    ID: `${Q3_SALE_2026_PREFIX}-unlimited-to-duo`,
    featureCode: FeatureCode.OfferQ3Sale2026UnlimitedToDuo,
    ref: 'offer_26_sep_unlimited_duo_mail_web',
    getRef: (product, currentPlan) => `offer_26_sep_${currentPlan}_duo_${product}_web`,
    dealName: PLAN_NAMES[PLANS.DUO],
    couponCode: COUPON_CODES.SEP26BUNDLESALE,
    features: getDuoFeatures,
    title: getMorePowerTitle,
    modalImage: kv40,
};

const getFamilyFeatures = (product: OfferProduct) => {
    return [
        { name: getFamilyPremiumApps(product) },
        { name: c('q3campaign2026: Info').t`6 individual accounts` },
        { name: c('q3campaign2026: Info').t`3 TB of secure storage` },
    ];
};

const duoToFamily: Q3Offer = {
    ID: `${Q3_SALE_2026_PREFIX}-duo-to-family`,
    featureCode: FeatureCode.OfferQ3Sale2026DuoToFamily,
    ref: 'offer_26_sep_duo_family_mail_web',
    getRef: (product, currentPlan) => `offer_26_sep_${currentPlan}_family_${product}_web`,
    dealName: PLAN_NAMES[PLANS.FAMILY],
    couponCode: COUPON_CODES.SEP26BUNDLESALE,
    features: getFamilyFeatures,
    title: getMaxSavingsTitle,
    modalImage: kv40,
};

// Same Family 12M deal as duoToFamily, but for monthly Family subscribers switching to yearly.
// Kept separate so it carries its own tracking ref and feature flag.
const familyMonthlyToYearly: Q3Offer = {
    ID: `${Q3_SALE_2026_PREFIX}-family-monthly-to-yearly`,
    featureCode: FeatureCode.OfferQ3Sale2026FamilyMonthlyToYearly,
    ref: 'offer_26_sep_family_family12_mail_web',
    getRef: (product, currentPlan) => `offer_26_sep_${currentPlan}_family12_${product}_web`,
    dealName: PLAN_NAMES[PLANS.FAMILY],
    couponCode: COUPON_CODES.SEP26BUNDLESALE,
    features: getFamilyFeatures,
    title: getMaxSavingsTitle,
    modalImage: kv40,
};

export const offers = {
    'free-to-unlimited': freeToUnlimited,
    'plus-to-unlimited': plusToUnlimited,
    'unlimited-to-duo': unlimitedToDuo,
    'duo-to-family': duoToFamily,
    'family-monthly-to-yearly': familyMonthlyToYearly,
} as const;

export type Q3Sale2026OfferId = `${typeof Q3_SALE_2026_PREFIX}-${keyof typeof offers}`;
