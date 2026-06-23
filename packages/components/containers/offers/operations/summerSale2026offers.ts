import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, PLANS, PLAN_NAMES } from '@proton/payments';
import {
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';

const SUMMER_SALE_2026_PREFIX = 'summer-sale-2026';

interface SummerOffer {
    ID: SummerSale2026OfferId;
    featureCode: FeatureCode;
    ref: string;
    dealName: string;
    couponCode: COUPON_CODES;
    features?: () => { name: string }[];
}

const freeToDrivePlus: SummerOffer = {
    ID: `${SUMMER_SALE_2026_PREFIX}-free-to-drive-plus`,
    featureCode: FeatureCode.OfferSummerSale2026FreeToDrivePlus,
    ref: 'offer_26_june_free_driveplus_web',
    dealName: `${DRIVE_SHORT_APP_NAME} Plus`,
    couponCode: COUPON_CODES.JUNE26SALE,
    features: () => [
        { name: c('q2campaign2026: Info').t`200 GB storage: 40x your current plan` },
        { name: c('q2campaign2026: Info').t`Online document and spreadsheet editor` },
        { name: c('q2campaign2026: Info').t`Recover previous file versions` },
    ],
};

const freeToMailPlus: SummerOffer = {
    ID: `${SUMMER_SALE_2026_PREFIX}-free-to-mail-plus`,
    featureCode: FeatureCode.OfferSummerSale2026FreeToMailPlus,
    ref: 'offer_26_june_free_mailplus_web',
    dealName: `${MAIL_SHORT_APP_NAME} Plus`,
    couponCode: COUPON_CODES.JUNE26SALE,
    features: () => [
        { name: c('q2campaign2026: Info').t`15 GB storage` },
        { name: c('q2campaign2026: Info').t`Unlimited folders, labels, and filters` },
        { name: c('q2campaign2026: Info').t`Use your own email domain` },
    ],
};

const mailPlusMonthlyToYearly: SummerOffer = {
    ID: `${SUMMER_SALE_2026_PREFIX}-mail-plus-monthly-to-yearly`,
    featureCode: FeatureCode.OfferSummerSale2026MailPlusMonthlyToYearly,
    ref: 'offer_26_june_mailplus_mailplus_web',
    dealName: `${MAIL_SHORT_APP_NAME} Plus`,
    couponCode: COUPON_CODES.JUNE26SALE,
    features: () => [
        { name: c('q2campaign2026: Info').t`15 GB storage` },
        { name: c('q2campaign2026: Info').t`Unlimited folders, labels, and filters` },
        { name: c('q2campaign2026: Info').t`Use your own email domain` },
    ],
};

const freeInboxToUnlimited: SummerOffer = {
    ID: `${SUMMER_SALE_2026_PREFIX}-free-inbox-to-unlimited`,
    featureCode: FeatureCode.OfferSummerSale2026FreeInboxToUnlimited,
    ref: 'offer_26_june_free_unlimited_web',
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.JUNE26BUNDLESALE,
    features: () => [
        {
            name: c('q2campaign2026: Info')
                .t`All premium features of ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
        },
        { name: c('q2campaign2026: Info').t`500 GB storage` },
        { name: c('q2campaign2026: Info').t`Stronger protection against cyber threats` },
    ],
};

const freeDriveToUnlimited: SummerOffer = {
    ID: `${SUMMER_SALE_2026_PREFIX}-free-drive-to-unlimited`,
    featureCode: FeatureCode.OfferSummerSale2026FreeDriveToUnlimited,
    ref: 'offer_26_june_free_unlimited_web',
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.JUNE26BUNDLESALE,
    features: () => [
        { name: c('q2campaign2026: Info').t`Full access to ${VPN_APP_NAME}` },
        { name: c('q2campaign2026: Info').t`500 GB storage` },
        {
            name: c('q2campaign2026: Info')
                .t`All premium features of ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
        },
    ],
};

const plusToUnlimited: SummerOffer = {
    ID: `${SUMMER_SALE_2026_PREFIX}-plus-to-unlimited`,
    featureCode: FeatureCode.OfferSummerSale2026PlusToUnlimited,
    ref: 'offer_26_june_mailplus_unlimited_web',
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.JUNE26BUNDLESALE,
    features: () => [
        {
            name: c('q2campaign2026: Info')
                .t`All premium features of ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
        },
        { name: c('q2campaign2026: Info').t`500 GB storage` },
        { name: c('q2campaign2026: Info').t`Stronger protection against cyber threats` },
    ],
};

const unlimitedToDuo: SummerOffer = {
    ID: `${SUMMER_SALE_2026_PREFIX}-unlimited-to-duo`,
    featureCode: FeatureCode.OfferSummerSale2026UnlimitedToDuo,
    ref: 'offer_26_june_unlimited_duo_web',
    dealName: PLAN_NAMES[PLANS.DUO],
    couponCode: COUPON_CODES.JUNE26BUNDLESALE,
    features: () => [
        {
            name: c('q2campaign2026: Info')
                .t`All premium features of ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
        },
        { name: c('q2campaign2026: Info').t`Individual accounts for you and a partner` },
        { name: c('q2campaign2026: Info').t`2 TB data storage` },
    ],
};

const duoToFamily: SummerOffer = {
    ID: `${SUMMER_SALE_2026_PREFIX}-duo-to-family`,
    featureCode: FeatureCode.OfferSummerSale2026DuoToFamily,
    ref: 'offer_26_june_duo_family_web',
    dealName: PLAN_NAMES[PLANS.FAMILY],
    couponCode: COUPON_CODES.JUNE26BUNDLESALE,
    features: () => [
        {
            name: c('q2campaign2026: Info')
                .t`All premium features of ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
        },
        { name: c('q2campaign2026: Info').t`Individual accounts for 6 users` },
        { name: c('q2campaign2026: Info').t`3 TB data storage` },
    ],
};

const drivePlusToUnlimited: SummerOffer = {
    ID: `${SUMMER_SALE_2026_PREFIX}-drive-plus-to-unlimited`,
    featureCode: FeatureCode.OfferSummerSale2026DrivePlusToUnlimited,
    ref: 'offer_26_june_driveplus_unlimited_web',
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.JUNE26BUNDLESALE,
    features: () => [
        { name: c('q2campaign2026: Info').t`Full access to ${VPN_APP_NAME}` },
        { name: c('q2campaign2026: Info').t`500 GB storage` },
        {
            name: c('q2campaign2026: Info')
                .t`All premium features of ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
        },
    ],
};

export const offers = {
    'free-to-drive-plus': freeToDrivePlus,
    'drive-plus-to-unlimited': drivePlusToUnlimited,

    'free-to-mail-plus': freeToMailPlus,
    'mail-plus-monthly-to-yearly': mailPlusMonthlyToYearly,

    'free-inbox-to-unlimited': freeInboxToUnlimited,
    'free-drive-to-unlimited': freeDriveToUnlimited,
    'plus-to-unlimited': plusToUnlimited,

    'unlimited-to-duo': unlimitedToDuo,
    'duo-to-family': duoToFamily,
} as const;

export type SummerSale2026OfferId = `${typeof SUMMER_SALE_2026_PREFIX}-${keyof typeof offers}`;
