import { c, msgid } from 'ttag';

import { Logo } from '@proton/components';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { PLANS } from '@proton/payments';
import { APPS, CYCLE, LUMO_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { SignupType } from '../../signup/interfaces';
import type { BenefitItem } from '../Benefits';
import Benefits from '../Benefits';
import { planCardFeatureProps } from '../PlanCardSelector';
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

const getQuestions = (n: number) => {
    return c('collider_2025: Info').ngettext(
        msgid`Ask up to ${n} question per day`,
        `Ask up to ${n} questions per day`,
        n
    );
};

const getFreeLumoFeatures = () => {
    return [
        {
            text: getQuestions(20),
            included: true,
        },
        {
            text: c('collider_2025: Info').t`Limited chat history (1 week)`,
            included: true,
        },
        {
            text: c('collider_2025: Info')
                .t`Handles shorter conversations (supports input equivalent of 5 pages of text)`,
            included: true,
        },
    ];
};

const getLumoPlusFeatures = () => {
    return [
        {
            text: c('collider_2025: feature').t`Unlimited questions every day`,
            included: true,
        },
        {
            text: c('collider_2025: feature').t`Unlimited chat history`,
            included: true,
        },
        {
            text: c('collider_2025: feature')
                .t`Handles complex conversations (supports input equivalent of 40 pages of text)`,
            included: true,
        },

        {
            text: c('collider_2025: feature').t`Favorite conversations`,
            included: true,
        },
        {
            text: c('collider_2025: feature').t`Priority access (get top priority, even during busy times)`,
            included: true,
        },
        {
            text: c('collider_2025: feature').t`Priority support`,
            included: true,
        },
    ];
};

export const getLumoConfiguration = (): SignupConfiguration => {
    const logo = <Logo appName={APPS.PROTONLUMO} />;

    const appName = LUMO_APP_NAME;

    const title = c('collider_2025: Info').t`Your private AI helper`;

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
