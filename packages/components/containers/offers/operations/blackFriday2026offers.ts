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
import { getPremium } from '@proton/shared/lib/helpers/premium';

import { getSecureVaultSharingText, getUnlimitedHideMyEmailAliasesText } from '../../payments/features/pass';
import kv from '../components/blackFriday2026/black-friday-2026-kv.webp';
import type { OfferProduct } from '../helpers/getOfferProduct';

const BLACK_FRIDAY_2026_PREFIX = 'black-friday-2026';

interface BlackFriday2026Offer {
    ID: BlackFriday2026OfferId;
    featureCode: FeatureCode;
    ref: string;
    dealName: string;
    couponCode: COUPON_CODES;
    getRef?: (product: OfferProduct, currentPlan: string) => string;
    features?: (product: OfferProduct) => { name: string }[];
    title: () => string;
    modalImage: string;
}

/**
 * Refs are `offer_bf_26_<app>_<currentPlan>_<offerPlan>_web`. The campaign tracks Inbox, Drive and the
 * account app entered from Pass separately. Calendar is part of Inbox, so it reports as `mail`. Feature
 * copy still orders the apps with Calendar first for Calendar users, which is why the product itself
 * stays `calendar`.
 */
const getRefApp = (product: OfferProduct) => {
    if (product === 'drive' || product === 'pass') {
        return product;
    }

    return 'mail';
};

// TODO: placeholder copy carried over from the Q3 sale, BF 2026 content is TBA in the campaign spec
// translator: offer headline, shown over the artwork and wrapped after the comma
const getFullPowerTitle = () => {
    return c('bfcampaign2026: Title').t`One plan, full power`;
};

// Each ordering needs its own context. The app names stay interpolated so they cannot be translated,
// but that makes every ordering collapse to the same `Premium ${0}, ${1}, ...` msgid, which
// i18n:validate rejects as a duplicate within one context. The context also tells the translator which
// app leads the list, which the positional placeholders alone do not.
const getPremiumApps = (product: OfferProduct) => {
    if (product === 'drive') {
        return c('bfcampaign2026: Info, Drive first')
            .t`Premium ${DRIVE_SHORT_APP_NAME}, ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`;
    }

    if (product === 'calendar') {
        return c('bfcampaign2026: Info, Calendar first')
            .t`Premium ${CALENDAR_SHORT_APP_NAME}, ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, and ${VPN_SHORT_APP_NAME}`;
    }

    return c('bfcampaign2026: Info, Mail first')
        .t`Premium ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`;
};

const getUnlimitedFeatures = (product: OfferProduct) => {
    return [
        { name: getPremiumApps(product) },
        { name: c('bfcampaign2026: Info').t`500 GB of secure storage` },
        { name: c('bfcampaign2026: Info').t`Advanced protection against cyber threats` },
    ];
};

const freeToUnlimited: BlackFriday2026Offer = {
    ID: `${BLACK_FRIDAY_2026_PREFIX}-free-to-unlimited`,
    featureCode: FeatureCode.OfferBlackFriday2026FreeToUnlimited,
    ref: 'offer_bf_26_mail_free_unlimited_web',
    getRef: (product, currentPlan) => `offer_bf_26_${getRefApp(product)}_${currentPlan}_unlimited_web`,
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.BLACK_FRIDAY_2026_BUNDLE,
    features: getUnlimitedFeatures,
    title: getFullPowerTitle,
    modalImage: kv,
};

// Runs alongside both free-user waves; its audience is paid single-product users, so it never overlaps
// them. The ref's plan segment is the literal `plus` from the spec rather than the user's actual plan.
// TODO: Inbox positions this as an upsell and Drive as an upgrade, copy is TBA in the campaign spec
const plusToUnlimited: BlackFriday2026Offer = {
    ID: `${BLACK_FRIDAY_2026_PREFIX}-plus-to-unlimited`,
    featureCode: FeatureCode.OfferBlackFriday2026PlusToUnlimited,
    ref: 'offer_bf_26_mail_plus_unlimited_web',
    getRef: (product) => `offer_bf_26_${getRefApp(product)}_plus_unlimited_web`,
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.BLACK_FRIDAY_2026_BUNDLE,
    features: getUnlimitedFeatures,
    title: getFullPowerTitle,
    modalImage: kv,
};

// TODO: placeholder copy carried over from the Q3 sale, BF 2026 content is TBA in the campaign spec
// translator: offer headline, shown over the artwork and wrapped after the comma
const getMorePowerTitle = () => {
    return c('bfcampaign2026: Title').t`One plan, more power`;
};

const getDuoFeatures = (product: OfferProduct) => {
    return [
        { name: getPremiumApps(product) },
        { name: c('bfcampaign2026: Info').t`2 individual accounts` },
        { name: c('bfcampaign2026: Info').t`2 TB of secure storage` },
    ];
};

// Runs alongside both free-user waves for Unlimited users. It shares its audience with the permanent
// Unlimited to Duo discounted offer, which useOfferConfig orders after the campaign so this one wins.
// TODO: Inbox positions this as an upsell and Drive as an upgrade, copy is TBA in the campaign spec
const unlimitedToDuo: BlackFriday2026Offer = {
    ID: `${BLACK_FRIDAY_2026_PREFIX}-unlimited-to-duo`,
    featureCode: FeatureCode.OfferBlackFriday2026UnlimitedToDuo,
    ref: 'offer_bf_26_mail_unlimited_duo_web',
    // TODO: the spec lists offer_26_sep_drive_unlimited_duo_web for Drive (copied from the Q3 sale);
    // this emits the corrected offer_bf_26_drive_unlimited_duo_web, confirm with Growth
    getRef: (product) => `offer_bf_26_${getRefApp(product)}_unlimited_duo_web`,
    dealName: PLAN_NAMES[PLANS.DUO],
    couponCode: COUPON_CODES.BLACK_FRIDAY_2026_BUNDLE,
    features: getDuoFeatures,
    title: getMorePowerTitle,
    modalImage: kv,
};

// TODO: placeholder copy carried over from the Q3 sale, BF 2026 content is TBA in the campaign spec
// translator: offer headline, shown over the artwork and wrapped after the comma
const getMaxSavingsTitle = () => {
    return c('bfcampaign2026: Title').t`One plan, max savings`;
};

// Family copy lists four apps and Calendar is not one of them, so a Calendar user keeps the default order.
const getFamilyPremiumApps = (product: OfferProduct) => {
    if (product === 'drive') {
        return c('bfcampaign2026: Info, Family, Drive first')
            .t`Premium ${DRIVE_SHORT_APP_NAME}, ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}`;
    }

    return c('bfcampaign2026: Info, Family, Mail first')
        .t`Premium ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}`;
};

const getFamilyFeatures = (product: OfferProduct) => {
    return [
        { name: getFamilyPremiumApps(product) },
        { name: c('bfcampaign2026: Info').t`6 individual accounts` },
        { name: c('bfcampaign2026: Info').t`3 TB of secure storage` },
    ];
};

// Runs alongside both free-user waves for Duo users.
// The spec also lists offer_bf_26_<app>_family_family12_web refs. In the Q3 sale those belonged to a
// separate Family monthly to Family 12M offer; whether that runs for BF 2026 is open with Growth, so
// only Duo to Family is built.
// TODO: Inbox positions this as an upsell and Drive as an upgrade, copy is TBA in the campaign spec
const duoToFamily: BlackFriday2026Offer = {
    ID: `${BLACK_FRIDAY_2026_PREFIX}-duo-to-family`,
    featureCode: FeatureCode.OfferBlackFriday2026DuoToFamily,
    ref: 'offer_bf_26_mail_duo_family_web',
    getRef: (product) => `offer_bf_26_${getRefApp(product)}_duo_family_web`,
    dealName: PLAN_NAMES[PLANS.FAMILY],
    couponCode: COUPON_CODES.BLACK_FRIDAY_2026_BUNDLE,
    features: getFamilyFeatures,
    title: getMaxSavingsTitle,
    modalImage: kv,
};

// TODO: placeholder copy, BF 2026 content is TBA in the campaign spec
// translator: offer headline for a single-product plan, shown over the artwork
const getPlusTitle = () => {
    return c('bfcampaign2026: Title').t`Black Friday sale`;
};

// Wave 2. The deal depends on which product the user is in, so each product is its own offer, scoped
// to its app in eligibility. The refs are static because each offer only ever runs in one place.
const freeToMailPlus: BlackFriday2026Offer = {
    ID: `${BLACK_FRIDAY_2026_PREFIX}-free-to-mail-plus`,
    featureCode: FeatureCode.OfferBlackFriday2026FreeToMailPlus,
    ref: 'offer_bf_26_mail_free_plus_web',
    dealName: PLAN_NAMES[PLANS.MAIL],
    couponCode: COUPON_CODES.BLACK_FRIDAY_2026_BUNDLE,
    features: () => {
        return [{ name: getPremium(MAIL_SHORT_APP_NAME, CALENDAR_SHORT_APP_NAME) }];
    },
    title: getPlusTitle,
    modalImage: kv,
};

const freeToDrivePlus: BlackFriday2026Offer = {
    ID: `${BLACK_FRIDAY_2026_PREFIX}-free-to-drive-plus`,
    featureCode: FeatureCode.OfferBlackFriday2026FreeToDrivePlus,
    // TODO: the spec lists the mail event in the Drive row; confirm this corrected name with Growth
    ref: 'offer_bf_26_drive_free_plus_web',
    dealName: PLAN_NAMES[PLANS.DRIVE],
    couponCode: COUPON_CODES.BLACK_FRIDAY_2026_BUNDLE,
    features: () => {
        return [{ name: getPremium(DRIVE_SHORT_APP_NAME) }];
    },
    title: getPlusTitle,
    modalImage: kv,
};

const freeToPassPlus: BlackFriday2026Offer = {
    ID: `${BLACK_FRIDAY_2026_PREFIX}-free-to-pass-plus`,
    featureCode: FeatureCode.OfferBlackFriday2026FreeToPassPlus,
    // TODO: not in the spec; confirm how Pass-entry traffic is attributed with Growth
    ref: 'offer_bf_26_pass_free_plus_web',
    dealName: PLAN_NAMES[PLANS.PASS],
    couponCode: COUPON_CODES.BLACK_FRIDAY_2026_BUNDLE,
    features: () => {
        return [
            { name: getPremium(PASS_SHORT_APP_NAME) },
            { name: getUnlimitedHideMyEmailAliasesText() },
            { name: getSecureVaultSharingText() },
        ];
    },
    title: getPlusTitle,
    modalImage: kv,
};

export const offers = {
    'free-to-unlimited': freeToUnlimited,
    'plus-to-unlimited': plusToUnlimited,
    'unlimited-to-duo': unlimitedToDuo,
    'duo-to-family': duoToFamily,
    'free-to-mail-plus': freeToMailPlus,
    'free-to-drive-plus': freeToDrivePlus,
    'free-to-pass-plus': freeToPassPlus,
} as const;

export type BlackFriday2026OfferId = `${typeof BLACK_FRIDAY_2026_PREFIX}-${keyof typeof offers}`;
