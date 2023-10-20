import { c } from 'ttag';

import { MailLogo } from '@proton/components/components';
import {
    get2FAAuthenticator,
    getCreditCards,
    getDevices,
    getHideMyEmailAliases,
    getItems,
    getLoginsAndNotes,
} from '@proton/components/containers/payments/features/pass';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import {
    APPS,
    CALENDAR_APP_NAME,
    CYCLE,
    MAIL_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PLANS,
} from '@proton/shared/lib/constants';
import { VPNServersCountData } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { SignupType } from '../../signup/interfaces';
import Benefits, { BenefitItem } from '../Benefits';
import BundlePlanSubSection from '../BundlePlanSubSection';
import { PlanCard, planCardFeatureProps } from '../PlanCardSelector';
import { getBenefits, getGenericBenefits, getGenericFeatures, getJoinString } from '../configuration/helper';
import { SignupConfiguration, SignupMode } from '../interface';
import CustomStep from './CustomStep';

export const getMailBenefits = (): BenefitItem[] => {
    return [
        {
            key: 'a',
            text: c('pass_signup_2023: Info').t`End-to-end encryption`,
            icon: {
                name: 'lock',
            },
        },
        ...getGenericBenefits(),
        {
            key: 'e',
            text: CALENDAR_APP_NAME,
            icon: {
                name: 'brand-proton-calendar',
            },
        },
    ];
};

export const getFreeMailFeatures = () => {
    return [getLoginsAndNotes(), getDevices(), getHideMyEmailAliases(10)];
};

export const getCustomMailFeatures = () => {
    return [
        getLoginsAndNotes(),
        getDevices(),
        getHideMyEmailAliases('unlimited'),
        get2FAAuthenticator(true),
        getItems(),
        getCreditCards(),
    ];
};

export const getMailConfiguration = ({
    isDesktop,
    vpnServersCountData,
    hideFreePlan,
}: {
    hideFreePlan: boolean;
    isDesktop: boolean;
    vpnServersCountData: VPNServersCountData;
}): SignupConfiguration => {
    const logo = <MailLogo />;

    const title = <>{c('mail_signup_2023: Info').t`Secure email that protects your privacy`}</>;

    const features = getGenericFeatures(isDesktop);

    const planCards: PlanCard[] = [
        !hideFreePlan && {
            plan: PLANS.FREE,
            subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getFreeMailFeatures()} />,
            type: 'standard' as const,
            guarantee: false,
        },
        {
            plan: PLANS.MAIL,
            subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getCustomMailFeatures()} />,
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
        titles: {
            [SignupMode.Default]: title,
            [SignupMode.Onboarding]: title,
        },
        features,
        benefits,
        planCards,
        signupTypes: [SignupType.Username],
        generateMnemonic: false,
        defaults: {
            plan: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
        },
        product: APPS.PROTONMAIL,
        shortProductAppName: MAIL_SHORT_APP_NAME,
        productAppName: MAIL_APP_NAME,
        setupImg: <></>,
        preload: <></>,
        CustomStep,
    };
};
