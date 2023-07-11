import { c } from 'ttag';

import { Icon, PassLogo } from '@proton/components/components';
import {
    get2FAAuthenticator,
    getCreditCards,
    getDevices,
    getHideMyEmailAliases,
    getItems,
    getLoginsAndNotes,
} from '@proton/components/containers/payments/features/pass';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { APPS, BRAND_NAME, CYCLE, PASS_APP_NAME, PASS_SHORT_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import Benefits, { BenefitItem } from '../Benefits';
import BundlePlanSubSection from '../BundlePlanSubSection';
import { PlanCard, planCardFeatureProps } from '../PlanCardSelector';
import swissFlag from '../flag.svg';
import { SignupMode } from '../interface';
import CustomStep from './CustomStep';
import { getInfo } from './InstallExtensionStep';
import setupPass from './onboarding.svg';
import recoveryKit from './recovery-kit.svg';

export const getPassBenefits = (): BenefitItem[] => {
    return [
        {
            key: 'a',
            text: c('pass_signup_2023: Info').t`Hide-my-email aliases protect your email from data breaches`,
            icon: {
                name: 'alias',
            },
        },
        {
            key: 'b',
            text: c('pass_signup_2023: Info').t`End-to-end encrypted notes`,
            icon: {
                name: 'lock',
            },
        },
        {
            key: 'c',
            text: c('pass_signup_2023: Info').t`Protected by Swiss privacy laws`,
            icon: {
                name: 'shield',
            },
        },
        {
            key: 'd',
            text: c('pass_signup_2023: Info').t`Open-source and audited`,
            icon: {
                name: 'magnifier',
            },
        },
        {
            key: 'e',
            text: c('pass_signup_2023: Info').t`Works on all devices`,
            icon: {
                name: 'mobile',
            },
        },
    ];
};

export const getFreePassFeatures = () => {
    return [getLoginsAndNotes(), getDevices(), getHideMyEmailAliases(10)];
};

export const getCustomPassFeatures = () => {
    return [
        getLoginsAndNotes(),
        getDevices(),
        getHideMyEmailAliases('unlimited'),
        get2FAAuthenticator(true),
        getItems(),
        getCreditCards(),
    ];
};

export const getPassConfiguration = ({ isDesktop }: { isDesktop: boolean }) => {
    const logo = <PassLogo />;

    const title = <>{c('pass_signup_2023: Info').t`Encrypted password manager that also protects your identity`}</>;

    const onboardingTitle = c('pass_signup_2023: Info').t`Unlock ${PASS_APP_NAME} premium features by upgrading`;

    const features = [
        {
            left: <Icon size={24} className="color-primary" name="lock" />,
            text: c('pass_signup_2023: Feature').t`End-to-end encrypted`,
        },
        {
            left: <Icon size={24} className="color-primary" name="globe" />,
            text: c('pass_signup_2023: Feature').t`Open source`,
        },
        {
            left: <img width="24" alt="" src={swissFlag} />,
            text: isDesktop
                ? c('pass_signup_2023: Feature').t`Protected by Swiss privacy laws`
                : c('pass_signup_2023: Feature').t`Swiss based`,
        },
    ].filter(isTruthy);

    const planCards: PlanCard[] = [
        {
            plan: PLANS.FREE,
            subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getFreePassFeatures()} />,
            type: 'standard',
            guarantee: false,
        },
        {
            plan: PLANS.PASS_PLUS,
            subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getCustomPassFeatures()} />,
            type: 'best',
            guarantee: true,
        },
        {
            plan: PLANS.BUNDLE,
            subsection: <BundlePlanSubSection />,
            type: 'standard',
            guarantee: true,
        },
    ];

    const benefitItems = getPassBenefits();
    const benefits = benefitItems && (
        <div>
            <div className="text-lg text-semibold">{c('pass_signup_2023: Info').t`${PASS_APP_NAME} benefits`}</div>
            <Benefits className="mt-5 mb-5" features={benefitItems} />
            <div>{c('pass_signup_2023: Info')
                .t`Join over 100 million people who have chosen ${BRAND_NAME} to stay safe online`}</div>
        </div>
    );

    return {
        logo,
        titles: {
            [SignupMode.Default]: title,
            [SignupMode.Onboarding]: onboardingTitle,
        },
        features,
        benefits,
        planCards,
        generateMnemonic: true,
        defaults: {
            plan: PLANS.PASS_PLUS,
            cycle: CYCLE.YEARLY,
        },
        product: APPS.PROTONPASS,
        shortAppName: PASS_SHORT_APP_NAME,
        productAppName: PASS_APP_NAME,
        setupImg: <img src={setupPass} alt={c('pass_signup_2023: Onboarding').t`Welcome to ${PASS_APP_NAME}`} />,
        preload: (
            <>
                <link rel="prefetch" href={recoveryKit} as="image" />
                <link rel="prefetch" href={setupPass} as="image" />
                {getInfo(null, noop).preload}
            </>
        ),
        CustomStep,
    };
};
