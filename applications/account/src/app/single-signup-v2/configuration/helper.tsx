import { c } from 'ttag';

import { Icon } from '@proton/components/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';

import type { BenefitItem } from '../Benefits';
import swissFlag from '../flag.svg';

export const getBenefits = (appName: string) => {
    return c('pass_signup_2023: Info').t`${appName} benefits`;
};

export const getJoinB2BString = () => {
    return c('drive_signup_2024: Info')
        .t`Join the 50,000+ organizations already benefiting from ${BRAND_NAME}'s security`;
};
export const getJoinString = (audience?: Audience) => {
    if (audience === Audience.B2B) {
        return getJoinB2BString();
    }
    return c('pass_signup_2023: Info')
        .t`Join over 100 million people who have chosen ${BRAND_NAME} to stay safe online`;
};

export const getBasedString = () => {
    return c('pass_signup_2023: Info').t`Based in Switzerland, GDPR compliant`;
};

export const getGenericBenefits = (): BenefitItem[] => {
    return [
        {
            key: 10,
            text: c('pass_signup_2023: Info').t`Protected by Swiss privacy laws`,
            icon: {
                name: 'shield',
            },
        },
        {
            key: 11,
            text: c('pass_signup_2023: Info').t`Open-source and audited`,
            icon: {
                name: 'magnifier',
            },
        },
    ];
};

export const getGenericFeatures = (isLargeViewport: boolean, audience?: Audience) => {
    const e2e = {
        key: 'e2e',
        left: <Icon size={6} className="color-primary" name="lock" />,
        text: c('pass_signup_2023: Feature').t`End-to-end encrypted`,
    };

    const swiss = {
        key: 'swiss',
        left: <img width="24" alt="" src={swissFlag} className="rounded-sm" />,
        text: isLargeViewport
            ? c('pass_signup_2023: Feature').t`Protected by Swiss privacy laws`
            : c('pass_signup_2023: Feature').t`Swiss based`,
    };

    const openSource = {
        key: 'open-source',
        left: <Icon size={6} className="color-primary" name="globe" />,
        text: c('pass_signup_2023: Feature').t`Open source`,
    };

    const gdpr = {
        key: 'gdpr',
        left: <Icon size={6} className="color-primary" name="shield" />,
        text: c('signup_2024: Feature').t`GDPR and HIPAA compliant`,
    };

    const audienceSpecificFeatures = audience === Audience.B2B ? [e2e, swiss, gdpr] : [e2e, openSource, swiss];

    return audienceSpecificFeatures;
};
