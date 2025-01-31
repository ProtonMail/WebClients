import { Logo } from '@proton/components';
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
    getEncryptedFeature,
    getJoinString,
    getNoLogsFeature,
    getSwissFeature,
    getSwissPrivacyLawsBenefit,
} from '../configuration/helper';
import type { SignupConfiguration } from '../interface';
import setupAccount from '../mail/account-setup.svg';
import CustomStep from './CustomStep';

const getLumoBenefits = (): BenefitItem[] => {
    return [getSwissPrivacyLawsBenefit()].filter(isTruthy);
};

const getFreeLumoFeatures = () => {
    return [];
};

const getLumoPlusFeatures = () => {
    return [];
};

export const getLumoConfiguration = (): SignupConfiguration => {
    const logo = <Logo appName={APPS.PROTONLUMO} />;

    const appName = LUMO_APP_NAME;

    const title = <SignupHeaderV2></SignupHeaderV2>;

    const features = [getNoLogsFeature(), getEncryptedFeature({ e2ee: false }), getSwissFeature({ fullText: true })];

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
        signupTypes: [SignupType.Email, SignupType.Username],
        generateMnemonic: false,
        defaults: {
            plan: PLANS.LUMO,
            cycle: CYCLE.YEARLY,
        },
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
