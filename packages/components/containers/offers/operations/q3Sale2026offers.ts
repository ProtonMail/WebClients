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

const Q3_SALE_2026_PREFIX = 'q3-sale-2026';

interface Q3Offer {
    ID: Q3Sale2026OfferId;
    featureCode: FeatureCode;
    ref: string;
    dealName: string;
    couponCode: COUPON_CODES;
    features?: () => { name: string }[];
}

const getUnlimitedFeatures = () => {
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
    ref: 'offer_26_sep_mail_free_unlimited_web',
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.SEP26BUNDLESALE,
    features: getUnlimitedFeatures,
};

const plusToUnlimited: Q3Offer = {
    ID: `${Q3_SALE_2026_PREFIX}-plus-to-unlimited`,
    featureCode: FeatureCode.OfferQ3Sale2026PlusToUnlimited,
    ref: 'offer_26_sep_mail_plus_unlimited_web',
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.SEP26BUNDLESALE,
    features: getUnlimitedFeatures,
};

const unlimitedToDuo: Q3Offer = {
    ID: `${Q3_SALE_2026_PREFIX}-unlimited-to-duo`,
    featureCode: FeatureCode.OfferQ3Sale2026UnlimitedToDuo,
    ref: 'offer_26_sep_mail_unlimited_duo_web',
    dealName: PLAN_NAMES[PLANS.DUO],
    couponCode: COUPON_CODES.SEP26BUNDLESALE,
    features: () => [
        {
            name: c('q3campaign2026: Info')
                .t`All premium features of ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
        },
        { name: c('q3campaign2026: Info').t`Individual accounts for you and a partner` },
        { name: c('q3campaign2026: Info').t`2 TB data storage` },
    ],
};

const getFamilyFeatures = () => {
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
    ref: 'offer_26_sep_mail_duo_family_web',
    dealName: PLAN_NAMES[PLANS.FAMILY],
    couponCode: COUPON_CODES.SEP26BUNDLESALE,
    features: getFamilyFeatures,
};

// Same Family 12M deal as duoToFamily, but for monthly Family subscribers switching to yearly.
// Separate operation so it carries its own tracking ref and feature flag.
const familyMonthlyToYearly: Q3Offer = {
    ID: `${Q3_SALE_2026_PREFIX}-family-monthly-to-yearly`,
    featureCode: FeatureCode.OfferQ3Sale2026FamilyMonthlyToYearly,
    ref: 'offer_26_sep_mail_family_family12_web',
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
