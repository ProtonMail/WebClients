import type { ReactNode } from 'react';

import { c } from 'ttag';

import { IcAt } from '@proton/icons/icons/IcAt';
import { IcClock } from '@proton/icons/icons/IcClock';
import { IcDesktop } from '@proton/icons/icons/IcDesktop';
import { IcDiamond } from '@proton/icons/icons/IcDiamond';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcLifeRing } from '@proton/icons/icons/IcLifeRing';
import { IcShield } from '@proton/icons/icons/IcShield';
import { IcShield2Bolt } from '@proton/icons/icons/IcShield2Bolt';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { IcTag } from '@proton/icons/icons/IcTag';
import { PLANS } from '@proton/payments';
import {
    BRAND_NAME,
    DARK_WEB_MONITORING_NAME,
    MAIL_SHORT_APP_NAME,
    PROTON_SENTINEL_NAME,
} from '@proton/shared/lib/constants';

export interface OfferFeature {
    id: string;
    icon: ReactNode;
    text: string;
    included: boolean;
}

export interface OfferPlanConfig {
    features: OfferFeature[];
    freeFeatures: OfferFeature[];
}

const getMailPlusFeatures = (): OfferFeature[] => {
    return [
        { id: 'mail-storage', icon: <IcStorage />, text: c('Feature').t`15 GB storage`, included: true },
        {
            id: 'mail-folders',
            icon: <IcTag />,
            text: c('Feature').t`Unlimited folders, labels and filters`,
            included: true,
        },
        { id: 'mail-domain', icon: <IcGlobe />, text: c('Feature').t`Use your own email domain`, included: true },
        { id: 'mail-pm-domain', icon: <IcAt />, text: c('Feature').t`Short domain @pm.me`, included: true },
        { id: 'mail-schedule', icon: <IcClock />, text: c('Feature').t`Schedule and snooze emails`, included: true },
        {
            id: 'mail-desktop',
            icon: <IcDesktop />,
            text: c('Feature').t`${BRAND_NAME} ${MAIL_SHORT_APP_NAME} desktop app`,
            included: true,
        },
        { id: 'mail-support', icon: <IcLifeRing />, text: c('Feature').t`Priority support`, included: true },
    ];
};

const getMailPlusFreeFeatures = (): OfferFeature[] => {
    return [
        { id: 'free-mail-storage', icon: <IcStorage />, text: c('Feature').t`500 MB Mail storage`, included: true },
        {
            id: 'free-mail-folders',
            icon: <IcTag />,
            text: c('Feature').t`3 folders, labels and filters`,
            included: true,
        },
        { id: 'free-mail-domain', icon: <IcGlobe />, text: c('Feature').t`Use your own email domain`, included: false },
        { id: 'free-mail-pm-domain', icon: <IcAt />, text: c('Feature').t`Short domain @pm.me`, included: false },
        {
            id: 'free-mail-schedule',
            icon: <IcClock />,
            text: c('Feature').t`Schedule and snooze emails`,
            included: false,
        },
        {
            id: 'free-mail-desktop',
            icon: <IcDesktop />,
            text: c('Feature').t`${BRAND_NAME} ${MAIL_SHORT_APP_NAME} desktop app`,
            included: false,
        },
        { id: 'free-mail-support', icon: <IcLifeRing />, text: c('Feature').t`Priority support`, included: false },
    ];
};

const getBundleFeatures = (): OfferFeature[] => {
    return [
        { id: 'bundle-storage', icon: <IcStorage />, text: c('Feature').t`500 GB storage`, included: true },
        { id: 'bundle-domains', icon: <IcGlobe />, text: c('Feature').t`3 email domains`, included: true },
        {
            id: 'bundle-premium',
            icon: <IcDiamond />,
            text: c('Feature').t`Premium features in Mail, Calendar, Drive, Pass and VPN`,
            included: true,
        },
        {
            id: 'bundle-sentinel',
            icon: <IcShield />,
            text: c('Feature').t`${PROTON_SENTINEL_NAME} account protection`,
            included: true,
        },
        { id: 'bundle-dark-web', icon: <IcShield2Bolt />, text: DARK_WEB_MONITORING_NAME, included: true },
        { id: 'bundle-support', icon: <IcLifeRing />, text: c('Feature').t`Priority support`, included: true },
    ];
};

const getBundleFreeFeatures = (): OfferFeature[] => {
    return [
        { id: 'free-bundle-storage', icon: <IcStorage />, text: c('Feature').t`500 MB storage`, included: true },
        {
            id: 'free-bundle-domain',
            icon: <IcGlobe />,
            text: c('Feature').t`Use your own email domain`,
            included: false,
        },
        {
            id: 'free-bundle-premium',
            icon: <IcDiamond />,
            text: c('Feature').t`Premium features in Mail, Calendar, Drive, Pass and VPN`,
            included: false,
        },
        {
            id: 'free-bundle-sentinel',
            icon: <IcShield />,
            text: c('Feature').t`${PROTON_SENTINEL_NAME} account protection`,
            included: false,
        },
        { id: 'free-bundle-dark-web', icon: <IcShield2Bolt />, text: DARK_WEB_MONITORING_NAME, included: false },
        { id: 'free-bundle-support', icon: <IcLifeRing />, text: c('Feature').t`Priority support`, included: false },
    ];
};

export const getOfferConfig = (planName: PLANS): OfferPlanConfig | undefined => {
    const configs: Partial<Record<PLANS, OfferPlanConfig>> = {
        [PLANS.MAIL]: {
            features: getMailPlusFeatures(),
            freeFeatures: getMailPlusFreeFeatures(),
        },
        [PLANS.BUNDLE]: {
            features: getBundleFeatures(),
            freeFeatures: getBundleFreeFeatures(),
        },
    };

    return configs[planName];
};
