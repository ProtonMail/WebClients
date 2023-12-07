import { c } from 'ttag';

import { MailLogo } from '@proton/components/components';
import { getCalendarAppFeature } from '@proton/components/containers/payments/features/calendar';
import { getStorageFeature } from '@proton/components/containers/payments/features/drive';
import { getSupport } from '@proton/components/containers/payments/features/highlights';
import {
    getFoldersAndLabelsFeature,
    getNAddressesFeature,
    getNDomainsFeature,
    getNMessagesFeature,
} from '@proton/components/containers/payments/features/mail';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import {
    APPS,
    BRAND_NAME,
    CALENDAR_APP_NAME,
    CYCLE,
    MAIL_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PLANS,
} from '@proton/shared/lib/constants';
import { Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { SignupType } from '../../signup/interfaces';
import Benefits, { BenefitItem } from '../Benefits';
import BundlePlanSubSection from '../BundlePlanSubSection';
import { PlanCard, planCardFeatureProps } from '../PlanCardSelector';
import { getBenefits, getGenericBenefits, getGenericFeatures, getJoinString } from '../configuration/helper';
import { SignupConfiguration } from '../interface';
import CustomStep from './CustomStep';
import setupAccount from './account-setup.svg';

export const getMailBenefits = (): BenefitItem[] => {
    return [
        {
            key: 1,
            text: c('pass_signup_2023: Info').t`End-to-end encryption`,
            icon: {
                name: 'lock',
            },
        },
        ...getGenericBenefits(),
        {
            key: 2,
            text: CALENDAR_APP_NAME,
            icon: {
                name: 'brand-proton-calendar',
            },
        },
    ];
};

export const getFreeMailFeatures = () => {
    return [
        getStorageFeature(-1),
        getNAddressesFeature({ n: 1 }),
        getFoldersAndLabelsFeature(3),
        getNMessagesFeature(150),
    ];
};

export const getCustomMailFeatures = (plan: Plan | undefined) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeature(plan.MaxSpace),
        getNAddressesFeature({ n: plan.MaxAddresses }),
        getFoldersAndLabelsFeature('unlimited'),
        getNMessagesFeature('unlimited'),
        getNDomainsFeature({ n: plan.MaxDomains }),
        getSupport('priority'),
        getCalendarAppFeature(),
    ];
};

export const getPlanTitle = (plan: Plan | undefined) => {
    if (!plan) {
        return;
    }
    if (plan.Name === PLANS.NEW_VISIONARY) {
        return c('mail_signup_2023: Info').t`Become a Visionary and be part of ${BRAND_NAME}'s story`;
    }
};

export const getMailConfiguration = ({
    plan,
    isLargeViewport,
    vpnServersCountData,
    hideFreePlan,
    plansMap,
}: {
    plan: Plan | undefined;
    hideFreePlan: boolean;
    isLargeViewport: boolean;
    vpnServersCountData: VPNServersCountData;
    plansMap?: PlansMap;
}): SignupConfiguration => {
    const logo = <MailLogo />;

    const title = (() => {
        return <>{getPlanTitle(plan) || c('mail_signup_2023: Info').t`Secure email that protects your privacy`}</>;
    })();

    const features = getGenericFeatures(isLargeViewport);

    const planCards: PlanCard[] = [
        !hideFreePlan && {
            plan: PLANS.FREE,
            subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getFreeMailFeatures()} />,
            type: 'standard' as const,
            guarantee: false,
        },
        {
            plan: PLANS.MAIL,
            subsection: (
                <PlanCardFeatureList
                    {...planCardFeatureProps}
                    features={getCustomMailFeatures(plansMap?.[PLANS.MAIL])}
                />
            ),
            type: 'best' as const,
            guarantee: true,
        },
        {
            plan: PLANS.BUNDLE,
            subsection: <BundlePlanSubSection vpnServersCountData={vpnServersCountData} />,
            type: 'standard' as const,
            guarantee: true,
        },
    ].filter(isTruthy);

    const benefitItems = getMailBenefits();
    const benefits = benefitItems && (
        <div>
            <div className="text-lg text-semibold">{getBenefits(MAIL_APP_NAME)}</div>
            <Benefits className="mt-5 mb-5" features={benefitItems} />
            <div>{getJoinString()}</div>
        </div>
    );

    return {
        logo,
        title,
        features,
        benefits,
        planCards,
        signupTypes: [SignupType.Username],
        onboarding: {
            user: false,
            signup: true,
        },
        generateMnemonic: false,
        defaults: {
            plan: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
        },
        product: APPS.PROTONMAIL,
        shortProductAppName: MAIL_SHORT_APP_NAME,
        productAppName: MAIL_APP_NAME,
        setupImg: <img src={setupAccount} alt="" />,
        preload: (
            <>
                <link rel="prefetch" href={setupAccount} as="image" />
            </>
        ),
        CustomStep,
    };
};
