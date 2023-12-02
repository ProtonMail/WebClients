import { c } from 'ttag';

import { Icon } from '@proton/components/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { BenefitItem } from '../Benefits';
import swissFlag from '../flag.svg';

export const getBenefits = (appName: string) => {
    return c('pass_signup_2023: Info').t`${appName} benefits`;
};
export const getJoinString = () => {
    return c('pass_signup_2023: Info')
        .t`Join over 100 million people who have chosen ${BRAND_NAME} to stay safe online`;
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
        {
            key: 12,
            text: c('pass_signup_2023: Info').t`Works on all devices`,
            icon: {
                name: 'mobile',
            },
        },
    ];
};

export const getGenericFeatures = (isLargeViewport: boolean) => {
    return [
        {
            key: 1,
            left: <Icon size={24} className="color-primary" name="lock" />,
            text: c('pass_signup_2023: Feature').t`End-to-end encrypted`,
        },
        {
            key: 2,
            left: <Icon size={24} className="color-primary" name="globe" />,
            text: c('pass_signup_2023: Feature').t`Open source`,
        },
        {
            key: 3,
            left: <img width="24" alt="" src={swissFlag} />,
            text: isLargeViewport
                ? c('pass_signup_2023: Feature').t`Protected by Swiss privacy laws`
                : c('pass_signup_2023: Feature').t`Swiss based`,
        },
    ];
};
