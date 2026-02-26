import { c } from 'ttag';

import { FeatureCode } from '@proton/features/interface';
import { COUPON_CODES, PLANS, PLAN_NAMES } from '@proton/payments';
import {
    DARK_WEB_MONITORING_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';

const SPRING_SALE_2026_PREFIX = 'spring-sale-2026';

interface SpringOffer {
    ID: SpringSale2026OfferId;
    featureCode: FeatureCode;
    ref: string;
    dealName: string;
    couponCode: COUPON_CODES;
    features: () => { name: string }[];
}

const mailPlus: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-mail-plus`,
    featureCode: FeatureCode.OfferMar26MailPlus,
    ref: 'proton_mar_26_mail_free_web',
    dealName: `${MAIL_SHORT_APP_NAME} Plus`,
    couponCode: COUPON_CODES.MAR26SALE,
    features: () => [
        { name: c('q1campaign: Info').t`15 GB storage` },
        { name: c('q1campaign: Info').t`Unlimited folders, labels, and filters` },
        { name: c('q1campaign: Info').t`Use your own email domain` },
    ],
};

const mailPlusToYearly: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-mail-plus-to-yearly`,
    featureCode: FeatureCode.OfferMar26MailPlusToYearly,
    ref: 'proton_mar_26_mail_1m_web',
    dealName: `${MAIL_SHORT_APP_NAME} Plus`,
    couponCode: COUPON_CODES.MAR26SALE,
    features: () => [
        { name: c('q1campaign: Info').t`15 GB storage` },
        { name: c('q1campaign: Info').t`Unlimited folders, labels, and filters` },
        { name: c('q1campaign: Info').t`Use your own email domain` },
    ],
};

const mailPlusRetention: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-mail-plus-retention`,
    featureCode: FeatureCode.OfferMar26MailPlusRetention,
    ref: 'proton_mar_26_mail_plus_retention_web',
    dealName: `${MAIL_SHORT_APP_NAME} Plus`,
    couponCode: COUPON_CODES.MAR26SALE,
    features: () => [
        { name: c('q1campaign: Info').t`15 GB storage` },
        { name: c('q1campaign: Info').t`Unlimited folders, labels, and filters` },
        { name: c('q1campaign: Info').t`Use your own email domain` },
    ],
};

const vpnPlus: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-vpn-plus`,
    featureCode: FeatureCode.OfferMar26VpnPlus,
    ref: 'proton_mar_26_vpn_free_web',
    dealName: `${VPN_SHORT_APP_NAME} Plus`,
    couponCode: COUPON_CODES.MAR26SALE,
    features: () => [
        { name: c('q1campaign: Info').t`Connect 10 devices at once` },
        { name: c('q1campaign: Info').t`Access 15,000+ servers in 120+ countries` },
        { name: c('q1campaign: Info').t`Block ads, trackers, and malware` },
    ],
};

const vpnPlusToYearly: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-vpn-plus-to-yearly`,
    featureCode: FeatureCode.OfferMar26VpnPlusToYearly,
    ref: 'proton_mar_26_vpn_1m_web',
    dealName: `${VPN_SHORT_APP_NAME} Plus`,
    couponCode: COUPON_CODES.MAR26SALE,
    features: () => [
        { name: c('q1campaign: Info').t`Connect 10 devices at once` },
        { name: c('q1campaign: Info').t`Access 15,000+ servers in 120+ countries` },
        { name: c('q1campaign: Info').t`Block ads, trackers, and malware` },
    ],
};

const vpnPlusRetention: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-vpn-plus-retention`,
    featureCode: FeatureCode.OfferMar26VpnPlusRetention,
    ref: 'proton_mar_26_vpn_plus_retention_web',
    dealName: `${VPN_SHORT_APP_NAME} Plus`,
    couponCode: COUPON_CODES.MAR26SALE,
    features: () => [
        { name: c('q1campaign: Info').t`Connect 10 devices at once` },
        { name: c('q1campaign: Info').t`Access 15,000+ servers in 120+ countries` },
        { name: c('q1campaign: Info').t`Block ads, trackers, and malware` },
    ],
};

const drivePlus: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-drive-plus`,
    featureCode: FeatureCode.OfferMar26DrivePlus,
    ref: 'proton_mar_26_drive_free_web',
    dealName: `${DRIVE_SHORT_APP_NAME} Plus`,
    couponCode: COUPON_CODES.MAR26SALE,
    features: () => [
        { name: c('q1campaign: Info').t`200 GB storage: 40x your current plan` },
        { name: c('q1campaign: Info').t`Online document editor` },
        { name: c('q1campaign: Info').t`Recover previous file versions` },
    ],
};

const drivePlusRetention: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-drive-plus-retention`,
    featureCode: FeatureCode.OfferMar26DrivePlusRetention,
    ref: 'proton_mar_26_drive_plus_retention_web',
    dealName: `${DRIVE_SHORT_APP_NAME} Plus`,
    couponCode: COUPON_CODES.MAR26SALE,
    features: () => [
        { name: c('q1campaign: Info').t`200 GB storage: 40x your current plan` },
        { name: c('q1campaign: Info').t`Online document editor` },
        { name: c('q1campaign: Info').t`Recover previous file versions` },
    ],
};

const passPlus: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-pass-plus`,
    featureCode: FeatureCode.OfferMar26PassPlus,
    ref: 'proton_sep_25_pass_free_extension',
    dealName: `${PASS_SHORT_APP_NAME} Plus`,
    couponCode: COUPON_CODES.MAR26SALE,
    features: () => [
        { name: c('q1campaign: Info').t`Unlimited hide-my-email aliases` },
        { name: c('q1campaign: Info').t`Built-in 2FA authenticator` },
        { name: DARK_WEB_MONITORING_NAME },
    ],
};

const passPlusRetention: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-pass-plus-retention`,
    featureCode: FeatureCode.OfferMar26PassPlusRetention,
    ref: 'proton_sep_25_pass_free_retention_extension',
    dealName: `${PASS_SHORT_APP_NAME} Plus`,
    couponCode: COUPON_CODES.MAR26SALE,
    features: () => [
        { name: c('q1campaign: Info').t`Unlimited hide-my-email aliases` },
        { name: c('q1campaign: Info').t`Built-in 2FA authenticator` },
        { name: DARK_WEB_MONITORING_NAME },
    ],
};

const unlimitedFromVpnPlus: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-unlimited-from-vpn-plus`,
    featureCode: FeatureCode.OfferMar26UnlimitedFromVpnPlus,
    ref: 'proton_mar_26_vpn_plus_web',
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.MAR26BUNDLESALE,
    features: () => [
        { name: c('q1campaign: Info').t`All premium features of Mail, Pass, Drive, VPN, and Calendar` },
        { name: c('q1campaign: Info').t`500 GB storage` },
        { name: c('q1campaign: Info').t`Stronger protection against cyber threats` },
    ],
};

const unlimitedFromMailPlus: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-unlimited-from-mail-plus`,
    featureCode: FeatureCode.OfferMar26UnlimitedFromMailPlus,
    ref: 'proton_mar_26_mail_plus_web',
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.MAR26BUNDLESALE,
    features: () => [
        { name: c('q1campaign: Info').t`All premium features of Mail, Pass, Drive, VPN, and Calendar` },
        { name: c('q1campaign: Info').t`500 GB storage` },
        { name: c('q1campaign: Info').t`Stronger protection against cyber threats` },
    ],
};

const unlimitedFromDrivePlus: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-unlimited-from-drive-plus`,
    featureCode: FeatureCode.OfferMar26UnlimitedFromDrivePlus,
    ref: 'proton_mar_26_drive_plus_web',
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.MAR26BUNDLESALE,
    features: () => [
        { name: c('q1campaign: Info').t`500 GB storage` },
        { name: c('q1campaign: Info').t`Full access to ${VPN_APP_NAME}` },
        { name: c('q1campaign: Info').t`All premium features of Mail, Pass, Drive, VPN, and Calendar` },
    ],
};

// TODO: valid? it's for the extension
const unlimitedFromPassPlus: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-unlimited-from-pass-plus`,
    featureCode: FeatureCode.OfferMar26UnlimitedFromPassPlus,
    ref: 'proton_sep_25_pass_plus_extension',
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.MAR26BUNDLESALE,
    features: () => [
        { name: c('q1campaign: Info').t`All premium features of Mail, Pass, Drive, VPN, and Calendar` },
        { name: c('q1campaign: Info').t`500 GB storage` },
        { name: c('q1campaign: Info').t`Stronger protection against cyber threats` },
    ],
};

const unlimitedRetention: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-unlimited-retention`,
    featureCode: FeatureCode.OfferMar26UnlimitedRetention,
    ref: 'proton_mar_26_unlimited_retention_web',
    dealName: PLAN_NAMES[PLANS.BUNDLE],
    couponCode: COUPON_CODES.MAR26OFFER, // Why not MAR26BUNDLESALE?
    features: () => [
        { name: c('q1campaign: Info').t`All premium features of Mail, Pass, Drive, VPN, and Calendar` },
        { name: c('q1campaign: Info').t`500 GB storage` },
        { name: c('q1campaign: Info').t`Stronger protection against cyber threats` },
    ],
};

const duo: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-duo`,
    featureCode: FeatureCode.OfferMar26Duo,
    ref: 'proton_mar_26_unlimited_web', // Plan from which user upgrades
    dealName: PLAN_NAMES[PLANS.DUO],
    couponCode: COUPON_CODES.MAR26BUNDLESALE,
    features: () => [
        { name: c('q1campaign: Info').t`All premium features of Mail, Pass, Drive, VPN, and Calendar` },
        { name: c('q1campaign: Info').t`Individual accounts for you and a partner` },
        { name: c('q1campaign: Info').t`2 TB data storage` },
    ],
};

const family: SpringOffer = {
    ID: `${SPRING_SALE_2026_PREFIX}-family`,
    featureCode: FeatureCode.OfferMar26Family,
    ref: 'proton_mar_26_duo_web', // Plan from which user upgrades
    dealName: PLAN_NAMES[PLANS.FAMILY],
    couponCode: COUPON_CODES.MAR26BUNDLESALE,
    features: () => [
        { name: c('q1campaign: Info').t`All premium features of Mail, Pass, Drive, VPN, and Calendar` },
        { name: c('q1campaign: Info').t`Individual accounts for 6 users` },
        { name: c('q1campaign: Info').t`3 TB data storage` },
    ],
};

export const offers = {
    'mail-plus': mailPlus,
    'mail-plus-to-yearly': mailPlusToYearly,
    'mail-plus-retention': mailPlusRetention,

    'vpn-plus': vpnPlus,
    'vpn-plus-to-yearly': vpnPlusToYearly,
    'vpn-plus-retention': vpnPlusRetention,

    'drive-plus': drivePlus,
    'drive-plus-retention': drivePlusRetention,

    'pass-plus': passPlus,
    'pass-plus-retention': passPlusRetention,

    'unlimited-from-vpn-plus': unlimitedFromVpnPlus,
    'unlimited-from-mail-plus': unlimitedFromMailPlus,
    'unlimited-from-drive-plus': unlimitedFromDrivePlus,
    'unlimited-from-pass-plus': unlimitedFromPassPlus,
    'unlimited-retention': unlimitedRetention,

    duo,
    family,
} as const;

export type SpringSale2026OfferId = `${typeof SPRING_SALE_2026_PREFIX}-${keyof typeof offers}`;
