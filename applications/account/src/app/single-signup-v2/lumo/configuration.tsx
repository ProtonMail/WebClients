import { c } from 'ttag';

import { Icon, LumoLogo } from '@proton/components';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { CYCLE, PLANS } from '@proton/payments';
import { APPS, LUMO_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { SignupType } from '../../signup/interfaces';
import type { BenefitItem } from '../Benefits';
import Benefits from '../Benefits';
import { planCardFeatureProps } from '../PlanCardSelector';
import SignupHeaderV2 from '../SignupHeaderV2';
import {
    getBenefits,
    getBuiltInEncryptionBenefit,
    getEncryptedFeature,
    getJoinString,
    getNoLogsFeature,
} from '../configuration/helper';
import type { SignupConfiguration } from '../interface';
import setupAccount from '../mail/account-setup.svg';
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

const getNoModelTrainingBenefit = (): BenefitItem => {
    return {
        key: `no-model-training`,
        text: c('collider_2025: Info').t`Data never used for AI training`,
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
        {
            text: c('collider_2025: Info').t`Limited daily chats`,
            included: true,
        },
        {
            text: c('collider_2025: Info').t`Web search access`,
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
            text: c('collider_2025: Info').t`Unlimited daily chats`,
            included: true,
        },
        {
            text: c('collider_2025: Info').t`Web search access`,
            included: true,
        },
        {
            text: c('collider_2025: Info').t`Full chat history with search`,
            included: true,
        },
        {
            text: c('collider_2025: Info').t`Unlimited favorites for quick access`,
            included: true,
        },

        {
            text: c('collider_2025: Info').t`Upload and query multiple large files`,
            included: true,
        },
        {
            text: c('collider_2025: Info').t`Access to advanced AI models`,
            included: true,
        },
    ];
};

export const getLumoConfiguration = ({ defaultPlan }: { defaultPlan?: string }): SignupConfiguration => {
    const logo = <LumoLogo variant="wordmark-only" />;

    const appName = LUMO_APP_NAME;

    const title = (
        <SignupHeaderV2>{c('collider_2025: Info').t`AI assistant that respects your privacy`}</SignupHeaderV2>
    );

    const features = [getNoLogsFeature(), getEncryptedFeature({ e2ee: false }), getBuiltInEuropeFeature()];

    const planCards: SignupConfiguration['planCards'] = {
        [Audience.B2B]: [],
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
        const benefitItems = getLumoBenefits();
        return (
            benefitItems && (
                <div>
                    <div className="text-lg text-semibold">{getBenefits(appName)}</div>
                    <Benefits className="mt-5 mb-5" features={benefitItems} />
                    <div>{getJoinString()}</div>
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
        audience: Audience.B2C,
        signupTypes: [SignupType.External, SignupType.Proton],
        generateMnemonic: false,
        defaults: (() => {
            if (defaultPlan && [PLANS.FREE, PLANS.LUMO].includes(defaultPlan as PLANS)) {
                return {
                    plan: defaultPlan as PLANS,
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
