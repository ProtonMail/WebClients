import { c } from 'ttag';

import { LumoLogo } from '@proton/components';
import {
    getAccessToAdvancedAI,
    getChatHistory,
    getDailyChats,
    getDataProtectionCompliance,
    getFavourites,
    getNeverUsedForTraining,
    getNoLogsPolicy,
    getUploadAndQuery,
    getWebSearchAccess,
    getZeroAccessEncryption,
} from '@proton/components/containers/payments/features/lumo';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { IcMapPin } from '@proton/icons/icons/IcMapPin';
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
    left: <IcMapPin size={6} className="color-primary" />,
    text: c('collider_2025: Feature').t`Built and based in Europe`,
});

const getNoLogsBenefit = (): BenefitItem => {
    return {
        key: `no-logs`,
        text: getNoLogsPolicy().text,
        icon: {
            name: 'eye-slash',
        },
    };
};

const getNoModelTrainingBenefit = (): BenefitItem => {
    return {
        key: `no-model-training`,
        text: getNeverUsedForTraining().text,
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

const getFreeLumoFeatures = () => {
    return [
        getDailyChats('limited'),
        getWebSearchAccess(),
        getChatHistory('basic'),
        getFavourites('limited'),
        getUploadAndQuery('small'),
    ];
};

const getLumoPlusFeatures = () => {
    return [
        getDailyChats('unlimited'),
        getWebSearchAccess(),
        getChatHistory('full'),
        getFavourites('unlimited'),
        getUploadAndQuery('large'),
        getAccessToAdvancedAI(true),
    ];
};

const getLumoBusinessBenefits = (): BenefitItem[] => {
    return [
        {
            key: 'zero-access-encryption',
            text: getZeroAccessEncryption().text,
            icon: {
                name: 'lock',
            },
        },
        {
            key: 'unlimited-chats',
            text: getDailyChats('unlimited').text,
            icon: {
                name: 'checkmark',
            },
        },
        {
            key: 'web-search-access',
            text: getWebSearchAccess().text,
            icon: {
                name: 'checkmark',
            },
        },
        {
            key: 'full-chat-history',
            text: getChatHistory('full').text,
            icon: {
                name: 'checkmark',
            },
        },
        {
            key: 'file-analysis',
            text: getUploadAndQuery('large').text,
            icon: {
                name: 'checkmark',
            },
        },
        {
            key: 'advanced-models',
            text: getAccessToAdvancedAI(true).text,
            icon: {
                name: 'checkmark',
            },
        },
        {
            key: 'never-used-for-training',
            text: getNeverUsedForTraining().text,
            icon: {
                name: 'checkmark',
            },
        },
        {
            key: 'data-protection-compliance',
            text: getDataProtectionCompliance().text,
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
    isNewB2BPlanEnabled,
    vpnServersCountData,
    signupParameters,
}: {
    defaultPlan?: string;
    plansMap?: PlansMap;
    freePlan: FreePlanDefault;
    audience: Audience.B2B | Audience.B2C;
    planParameters: PlanParameters | undefined;
    isNewB2BPlanEnabled: boolean;
    vpnServersCountData: VPNServersCountData;
    signupParameters?: { trial?: boolean };
}): SignupConfiguration => {
    const logo = <LumoLogo variant="wordmark-only" />;

    const appName = LUMO_APP_NAME;

    const title = (
        <SignupHeaderV2>
            {audience === Audience.B2B
                ? c('collider_2025: Info').t`AI assistant that respects business confidentiality`
                : c('collider_2025: Info').t`AI assistant that respects your privacy`}
        </SignupHeaderV2>
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
            isNewB2BPlanEnabled
                ? {
                      plan: PLANS.BUNDLE_BIZ_2025,
                      subsection: (
                          <FeatureListPlanCardSubSection
                              description={c('lumo_signup_2025: Info')
                                  .t`Protect your entire business. Get ${LUMO_SHORT_APP_NAME} Professional with all ${BRAND_NAME} for Business apps and premium features.`}
                              features={
                                  <PlanCardFeatureList
                                      {...planCardFeatureProps}
                                      features={getCustomMailFeatures(plansMap?.[PLANS.BUNDLE_BIZ_2025], freePlan)}
                                  />
                              }
                          />
                      ),
                      type: 'best' as const,
                      guarantee: true,
                  }
                : {
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
            {
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
                return isNewB2BPlanEnabled
                    ? {
                          plan: PLANS.BUNDLE_BIZ_2025,
                          cycle: CYCLE.YEARLY,
                      }
                    : {
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
