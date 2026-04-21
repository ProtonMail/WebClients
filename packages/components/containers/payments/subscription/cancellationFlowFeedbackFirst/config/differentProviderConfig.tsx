import type { ReactNode } from 'react';

import { c } from 'ttag';

import MailLogo from '@proton/components/components/logo/MailLogo';
import CustomLogo from '@proton/components/containers/payments/subscription/YourPlanSectionV2/CustomLogo';
import { PLANS } from '@proton/payments';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import gmail from '@proton/styles/assets/img/illustrations/gmail-logo.svg';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';
import microsoft365Logo from '@proton/styles/assets/img/import/providers/microsoft_365.svg';
import outlookLogo from '@proton/styles/assets/img/import/providers/outlook.svg';
import yahoo from '@proton/styles/assets/img/import/providers/yahoo_short.svg';
import clsx from '@proton/utils/clsx';

import type { ComparisonFeatureRow } from '../components/ComparisonTable';

export interface Competitor {
    name: string;
    logo: string;
}

interface DifferentProviderConfig {
    protonHeader: ReactNode;
    features: ComparisonFeatureRow[];
}

interface ValueProps {
    greyed?: boolean;
}

const No = ({ greyed = true }: ValueProps) => {
    return <span className={clsx(greyed && 'color-hint')}>{c('Label').t`No`}</span>;
};

const Yes = ({ greyed }: ValueProps) => {
    return <span className={clsx(greyed && 'color-hint')}>{c('Label').t`Yes`}</span>;
};

export const B2C_COMPETITORS: Competitor[] = [
    { name: 'Gmail', logo: gmail },
    { name: 'Outlook', logo: outlookLogo },
    { name: 'Yahoo', logo: yahoo },
];

const getB2CFeatures = (): ComparisonFeatureRow[] => {
    return [
        {
            label: c('Label').t`Third-party ads`,
            leftValue: <No greyed />,
            rightValue: <Yes />,
        },
        {
            label: c('Label').t`Data harvesting`,
            leftValue: <No greyed />,
            rightValue: <Yes />,
        },
        {
            label: c('Label').t`End-to-end encryption`,
            leftValue: <Yes />,
            rightValue: <No greyed />,
        },
        {
            label: c('Label').t`Use your own email domain`,
            leftValue: <Yes />,
            rightValue: <No greyed />,
        },
        {
            label: c('Label').t`Block trackers and marketers`,
            leftValue: <Yes />,
            rightValue: <No />,
        },
        {
            label: c('Label').t`Free VPN included`,
            leftValue: <Yes />,
            rightValue: <No />,
        },
        {
            label: c('Label').t`Protected by Swiss privacy laws`,
            leftValue: <Yes />,
            rightValue: <No />,
        },
    ];
};

export const getDifferentProviderB2CConfig = (): DifferentProviderConfig => {
    return {
        protonHeader: (
            <>
                <MailLogo variant="glyph-only" size={7} />
                <span className="text-semibold">{MAIL_APP_NAME}</span>
            </>
        ),
        features: getB2CFeatures(),
    };
};

export const B2B_COMPETITORS: Competitor[] = [
    { name: 'Google Workspace', logo: googleLogo },
    { name: 'Microsoft 365', logo: microsoft365Logo },
];

const getB2BFeatures = (): ComparisonFeatureRow[] => {
    return [
        {
            label: c('Label').t`Email with @yourcompany.com domain`,
            leftValue: <Yes />,
            rightValue: <Yes />,
        },
        {
            label: c('Label').t`Online productivity suite`,
            leftValue: <Yes />,
            rightValue: <Yes />,
        },
        {
            label: c('Label').t`Zero-access architecture`,
            leftValue: <Yes />,
            rightValue: <No />,
        },
        {
            label: c('Label').t`End-to-end encryption`,
            leftValue: <Yes />,
            rightValue: <No />,
        },
        {
            label: c('Label').t`Open-source code`,
            leftValue: <Yes />,
            rightValue: <No />,
        },
        {
            label: c('Label').t`Protected by Swiss privacy laws`,
            leftValue: <Yes />,
            rightValue: <No />,
        },
    ];
};

export const getDifferentProviderB2BConfig = (): DifferentProviderConfig => {
    return {
        protonHeader: (
            <>
                <CustomLogo className="rounded" planName={PLANS.BUNDLE_PRO_2024} size={26} />
                <span className="text-semibold">{c('Label').t`${BRAND_NAME} for Business`}</span>
            </>
        ),
        features: getB2BFeatures(),
    };
};
