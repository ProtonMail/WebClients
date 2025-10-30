import { c } from 'ttag';

import { Icon, LumoLogo } from '@proton/components';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { ADDON_NAMES, CYCLE, type FreePlanDefault, PLANS, type PlansMap } from '@proton/payments';
import { APPS, BRAND_NAME, LUMO_APP_NAME, LUMO_SHORT_APP_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { Audience, type VPNServersCountData } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { SignupType } from '../../signup/interfaces';
import type { BenefitItem } from '../Benefits';
import Benefits from '../Benefits';
import FeatureListPlanCardSubSection from '../FeatureListPlanCardSubSection';
import LetsTalkSubSection from '../LetsTalkSubsection';
import { planCardFeatureProps } from '../PlanCardSelector';
import SignupHeaderV2 from '../SignupHeaderV2';
import {
    getBenefits,
    getBuiltInEncryptionBenefit,
    getEncryptedFeature,
    getJoinString,
    getNoLogsFeature,
} from '../configuration/helper';
import type { PlanParameters, SignupConfiguration } from '../interface';
import setupAccount from '../mail/account-setup.svg';
import { getCustomMailFeatures } from '../mail/configuration';
import CustomStep from './CustomStep';

const getBuiltInEuropeFeature = () => ({
    key: 'built-in-europe',
    left: <Icon size={6} className="color-primary" name="map-pin" />,
    text: c('collider_2025: Feature').t`Built and based in Europe`,
});

const getNoLogsBenefit = (): BenefitItem => {
    return {
        key: `no-logs`,
        text: c('collider_2025: Info').t`Strict no-logs policy`,
        icon: {
            name: 'eye-slash',
        },
    };
};

const neverUsedForTrainingText = () => {
    return c('collider_2025: Info').t`Data never used for AI training`;
};

const getNoModelTrainingBenefit = (): BenefitItem => {
    return {
        key: `no-model-training`,
        text: neverUsedForTrainingText(),
        icon: {
            name: 'alias',
        },
    };
};

const getOpenSourceBenefit = (): BenefitItem => {
    return {
        key: 'open-source',
        text: c('collider_2025: Info').t`Open source`,
        icon: {
            name: 'magnifier',
        },
    };
};

const getLumoBenefits = (): BenefitItem[] => {
    return [getBuiltInEncryptionBenefit(), getNoLogsBenefit(), getNoModelTrainingBenefit(), getOpenSourceBenefit()];
};

const unlimitedChatsText = () => {
    return c('collider_2025: Info').t`Unlimited daily chats`;
};

const webSearchAccessText = () => {
    return c('collider_2025: Info').t`Web search access`;
};

const fullChatHistoryText = () => {
    return c('collider_2025: Info').t`Full chat history with search`;
};

const fileAnalysisText = () => {
    return c('collider_2025: Info').t`Upload and query multiple large files`;
};

const advancedModelsText = () => {
    return c('collider_2025: Info').t`Access to advanced AI models`;
};

const zeroAccessEncryptionText = () => {
    return c('collider_2025: Info').t`Zero-access encryption`;
};

const dataProtectionComplianceText = () => {
    return c('collider_2025: Info').t`Compliance with data protection regulations`;
};

const getFreeLumoFeatures = () => {
    return [
        {
            text: c('collider_2025: Info').t`Limited daily chats`,
            included: true,
        },
        {
            text: webSearchAccessText(),
            included: true,
        },
        {
            text: c('collider_2025: Info').t`Basic chat history`,
            included: true,
        },
        {
            text: c('collider_2025: Info').t`Limited favorites`,
            included: true,
        },

        {
            text: c('collider_2025: Info').t`Upload and query small files`,
            included: true,
        },
    ];
};

const getLumoPlusFeatures = () => {
    return [
        {
            text: unlimitedChatsText(),
            included: true,
        },
        {
            text: webSearchAccessText(),
            included: true,
        },
        {
            text: fullChatHistoryText(),
            included: true,
        },
        {
            text: c('collider_2025: Info').t`Unlimited favorites for quick access`,
            included: true,
        },

        {
            text: fileAnalysisText(),
            included: true,
        },
        {
            text: advancedModelsText(),
            included: true,
        },
    ];
};

const getLumoBusinessBenefits = (): BenefitItem[] => {
    return [
        {
            key: 'zero-access-encryption',
            text: zeroAccessEncryptionText(),
            icon: {
                name: 'lock',
            },
        },
        {
            key: 'unlimited-chats',
            text: unlimitedChatsText(),
            icon: {
                name: 'checkmark',
            },
        },
        {
            key: 'web-search-access',
            text: webSearchAccessText(),
            icon: {
                name: 'checkmark',
            },
        },
        {
            key: 'full-chat-history',
            text: fullChatHistoryText(),
            icon: {
                name: 'checkmark',
            },
        },
        {
            key: 'file-analysis',
            text: fileAnalysisText(),
            icon: {
                name: 'checkmark',
            },
        },
        {
            key: 'advanced-models',
            text: advancedModelsText(),
            icon: {
                name: 'checkmark',
            },
        },
        {
            key: 'never-used-for-training',
            text: neverUsedForTrainingText(),
            icon: {
                name: 'checkmark',
            },
        },
        {
            key: 'data-protection-compliance',
            text: dataProtectionComplianceText(),
            icon: {
                name: 'checkmark',
            },
        },
    ];
};

const getLumoBusinessFeatures = () => {
    return getLumoBusinessBenefits().map(({ text }) => ({
        text,
        included: true,
    }));
};

export const getLumoConfiguration = ({
    defaultPlan,
    plansMap,
    freePlan,
    audience,
    planParameters,
    isLumoB2BEnabled,
    vpnServersCountData,
    signupParameters,
}: {
    defaultPlan?: string;
    plansMap?: PlansMap;
    freePlan: FreePlanDefault;
    audience: Audience.B2B | Audience.B2C;
    planParameters: PlanParameters | undefined;
    isLumoB2BEnabled: boolean;
    vpnServersCountData: VPNServersCountData;
    signupParameters?: { trial?: boolean };
}): SignupConfiguration => {
    const logo = <LumoLogo variant="wordmark-only" />;

    const appName = LUMO_APP_NAME;

    const title = (
        <SignupHeaderV2>{c('collider_2025: Info')
            .t`AI assistant that respects business confidentiality`}</SignupHeaderV2>
    );

    const features = [getNoLogsFeature(), getEncryptedFeature({ e2ee: false }), getBuiltInEuropeFeature()];

    const planCards: SignupConfiguration['planCards'] = {
        [Audience.B2B]: [
            {
                plan: PLANS.LUMO_BUSINESS,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getLumoBusinessFeatures()} />,
                type: 'standard' as const,
                guarantee: true,
            },
            {
                plan: PLANS.BUNDLE_PRO_2024,
                addons: { [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 1 },
                subsection: (
                    <FeatureListPlanCardSubSection
                        description={c('lumo_signup_2025: Info')
                            .t`Protect your entire business. Get ${LUMO_SHORT_APP_NAME} Professional with all ${BRAND_NAME} for Business apps and premium features.`}
                        features={
                            <PlanCardFeatureList
                                {...planCardFeatureProps}
                                features={getCustomMailFeatures(plansMap?.[PLANS.BUNDLE_PRO_2024], freePlan)}
                            />
                        }
                    />
                ),
                type: 'best' as const,
                guarantee: true,
            },
            {
                subsection: (
                    <LetsTalkSubSection
                        vpnServersCountData={vpnServersCountData}
                        signupParameters={signupParameters}
                        showLumoLogo={true}
                    />
                ),
                type: 'standard' as const,
                guarantee: true,
                interactive: false,
            },
        ],
        [Audience.B2C]: [
            {
                plan: PLANS.FREE,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getFreeLumoFeatures()} />,
                type: 'standard' as const,
                guarantee: false,
            },
            {
                plan: PLANS.LUMO,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getLumoPlusFeatures()} />,
                type: 'best' as const,
                guarantee: true,
            },
        ].filter(isTruthy),
    };

    const benefits = (() => {
        const benefitItems =
            planParameters?.defined && audience === Audience.B2B ? getLumoBusinessBenefits() : getLumoBenefits();

        return (
            benefitItems && (
                <div>
                    <div className="text-lg text-semibold">{getBenefits(appName)}</div>
                    <Benefits className="mt-5 mb-5" features={benefitItems} />
                    <div>{getJoinString(audience)}</div>
                </div>
            )
        );
    })();

    return {
        logo,
        title,
        features,
        benefits,
        planCards,
        audience,
        audiences: [
            {
                value: Audience.B2C,
                locationDescriptor: {
                    pathname: SSO_PATHS.LUMO_SIGNUP,
                },
                title: c('lumo_signup_2025: title').t`For individuals`,
                defaultPlan: PLANS.LUMO,
            },
            isLumoB2BEnabled && {
                value: Audience.B2B,
                locationDescriptor: {
                    pathname: SSO_PATHS.LUMO_SIGNUP_B2B,
                },
                title: c('lumo_signup_2025: title').t`For businesses`,
                defaultPlan: PLANS.BUNDLE_PRO_2024,
            },
        ].filter(isTruthy),
        signupTypes: [SignupType.External, SignupType.Proton],
        generateMnemonic: true,
        defaults: (() => {
            const plans = {
                [Audience.B2C]: planCards[Audience.B2C].map((it) => it.plan).filter(isTruthy),
                [Audience.B2B]: planCards[Audience.B2B].map((it) => it.plan).filter(isTruthy),
            }[audience];

            if (defaultPlan && plans.includes(defaultPlan as PLANS)) {
                return {
                    plan: defaultPlan as PLANS,
                    cycle: CYCLE.YEARLY,
                };
            }

            if (audience === Audience.B2B) {
                return {
                    plan: PLANS.BUNDLE_PRO_2024,
                    addons: { [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 1 },
                    cycle: CYCLE.YEARLY,
                };
            }

            return {
                plan: PLANS.LUMO,
                cycle: CYCLE.YEARLY,
            };
        })(),
        onboarding: {
            user: false,
            signup: true,
        },
        product: APPS.PROTONLUMO,
        shortProductAppName: LUMO_SHORT_APP_NAME,
        productAppName: LUMO_APP_NAME,
        setupImg: <img src={setupAccount} alt="" />,
        preload: (
            <>
                <link rel="prefetch" href={setupAccount} as="image" />
            </>
        ),
        CustomStep,
        cycles: [CYCLE.MONTHLY, CYCLE.YEARLY],
    };
};
