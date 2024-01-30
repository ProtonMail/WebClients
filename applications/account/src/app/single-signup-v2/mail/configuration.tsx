import { c } from 'ttag';

import { MailLogo } from '@proton/components/components';
import { getCalendarAppFeature } from '@proton/components/containers/payments/features/calendar';
import { getFreeMailStorageFeature, getStorageFeature } from '@proton/components/containers/payments/features/drive';
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
import { Audience, FreePlanDefault, Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { SignupType } from '../../signup/interfaces';
import Benefits, { BenefitItem } from '../Benefits';
import BundlePlanSubSection from '../BundlePlanSubSection';
import { PlanCard, planCardFeatureProps } from '../PlanCardSelector';
import { getBenefits, getGenericBenefits, getGenericFeatures, getJoinString } from '../configuration/helper';
import { PlanParameters, SignupConfiguration, SignupMode } from '../interface';
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

export const getFreeMailFeatures = (freePlan: FreePlanDefault) => {
    return [
        getFreeMailStorageFeature(freePlan),
        getNAddressesFeature({ n: 1 }),
        getFoldersAndLabelsFeature(3),
        getNMessagesFeature(150),
    ];
};

export const getCustomMailFeatures = (plan: Plan | undefined, freePlan: FreePlanDefault) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeature(plan.MaxSpace, { freePlan }),
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
    freePlan,
    mode,
    plan,
    audience,
    isLargeViewport,
    vpnServersCountData,
    planParameters,
    hideFreePlan,
    plansMap,
}: {
    freePlan: FreePlanDefault;
    audience: Audience.B2B | Audience.B2C;
    mode: SignupMode;
    plan: Plan | undefined;
    hideFreePlan: boolean;
    isLargeViewport: boolean;
    vpnServersCountData: VPNServersCountData;
    planParameters: PlanParameters | undefined;
    plansMap?: PlansMap;
}): SignupConfiguration => {
    const logo = <MailLogo />;

    const title = (() => {
        if (mode === SignupMode.MailReferral) {
            return c('Title').t`You’ve been invited to try ${MAIL_APP_NAME}`;
        }

        return (
            <>
                {(planParameters?.defined && getPlanTitle(plan)) ||
                    c('mail_signup_2023: Info').t`Secure email that protects your privacy`}
            </>
        );
    })();

    const features = getGenericFeatures(isLargeViewport);

    let planCards: PlanCard[] = [
        !hideFreePlan && {
            plan: PLANS.FREE,
            subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getFreeMailFeatures(freePlan)} />,
            type: 'standard' as const,
            guarantee: false,
        },
        {
            plan: PLANS.MAIL,
            subsection: (
                <PlanCardFeatureList
                    {...planCardFeatureProps}
                    features={getCustomMailFeatures(plansMap?.[PLANS.MAIL], freePlan)}
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

    if (mode === SignupMode.MailReferral) {
        planCards = [
            {
                plan: PLANS.FREE,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getFreeMailFeatures(freePlan)} />,
                type: 'standard' as const,
                guarantee: false,
            },
            {
                plan: PLANS.MAIL,
                subsection: (
                    <PlanCardFeatureList
                        {...planCardFeatureProps}
                        features={getCustomMailFeatures(plansMap?.[PLANS.MAIL], freePlan)}
                    />
                ),
                type: 'best' as const,
                guarantee: true,
            },
        ];
    }

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
        audience,
        title,
        features,
        benefits,
        planCards: { [Audience.B2C]: planCards, [Audience.B2B]: [] },
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
