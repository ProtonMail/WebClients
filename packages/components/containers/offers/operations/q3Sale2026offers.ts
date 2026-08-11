import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import {
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';

import type { OfferProduct } from '../helpers/getOfferProduct';

const Q3_SALE_2026_PREFIX = 'q3-sale-2026';

interface Q3Offer {
    ID: Q3Sale2026OfferId;
    featureCode: FeatureCode;
    ref: string;
    dealName: string;
    couponCode: COUPON_CODES;
    getRef?: (product: OfferProduct, currentPlan: string) => string;
    features?: (product?: OfferProduct) => { name: string }[];
}

const getUnlimitedFeatures = (product: OfferProduct = 'mail') => {
    if (product === 'drive') {
        return [
            { name: c('q3campaign2026: Info').t`Full access to ${VPN_APP_NAME}` },
            { name: c('q3campaign2026: Info').t`500 GB storage` },
            {
                name: c('q3campaign2026: Info')
                    .t`All premium features of ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
            },
        ];
    }

    return [
        {
            name: c('q3campaign2026: Info')
                .t`All premium features of ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
        },
        { name: c('q3campaign2026: Info').t`500 GB storage` },
        { name: c('q3campaign2026: Info').t`Stronger protection against cyber threats` },
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
};

const plusToUnlimited: Q3Offer = {
    ID: `${Q3_SALE_2026_PREFIX}-plus-to-unlimited`,
    featureCode: FeatureCode.OfferQ3Sale2026PlusToUnlimited,
    ref: 'offer_26_sep_mail_plus_unlimited_mail_web',
    getRef: (product, currentPlan) => `offer_26_sep_${currentPlan}_unlimited_${product}_web`,
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.SEP26BUNDLESALE,
    features: getUnlimitedFeatures,
};

// Duo copy is currently the same in every app: the bullets describe the plan, not the product. The
// product is still taken so a per-app variant is a local change if the campaign ever needs one.
const getDuoFeatures = (_product: OfferProduct = 'mail') => {
    return [
        {
            name: c('q3campaign2026: Info')
                .t`All premium features of ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
        },
        { name: c('q3campaign2026: Info').t`Individual accounts for you and a partner` },
        { name: c('q3campaign2026: Info').t`2 TB data storage` },
    ];
};

// Unlimited is an account-level plan, so the audience is the same in every campaign app rather than
// being product-specific. The ref still records which app the user converted from.
const unlimitedToDuo: Q3Offer = {
    ID: `${Q3_SALE_2026_PREFIX}-unlimited-to-duo`,
    featureCode: FeatureCode.OfferQ3Sale2026UnlimitedToDuo,
    ref: 'offer_26_sep_unlimited_duo_mail_web',
    getRef: (product, currentPlan) => `offer_26_sep_${currentPlan}_duo_${product}_web`,
    dealName: PLAN_NAMES[PLANS.DUO],
    couponCode: COUPON_CODES.SEP26BUNDLESALE,
    features: getDuoFeatures,
};

// As with Duo, Family copy does not vary by app yet, but takes the product so it can.
const getFamilyFeatures = (_product: OfferProduct = 'mail') => {
    return [
        {
            name: c('q3campaign2026: Info')
                .t`All premium features of ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
        },
        { name: c('q3campaign2026: Info').t`Individual accounts for 6 users` },
        { name: c('q3campaign2026: Info').t`3 TB data storage` },
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
};

export const offers = {
    'free-to-unlimited': freeToUnlimited,
    'plus-to-unlimited': plusToUnlimited,
    'unlimited-to-duo': unlimitedToDuo,
    'duo-to-family': duoToFamily,
    'family-monthly-to-yearly': familyMonthlyToYearly,
} as const;

export type Q3Sale2026OfferId = `${typeof Q3_SALE_2026_PREFIX}-${keyof typeof offers}`;
