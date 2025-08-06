import { c } from 'ttag';

import { AppsLogos, Logo } from '@proton/components';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { CYCLE, PLANS } from '@proton/payments';
import {
    APPS,
    AUTHENTICATOR_APP_NAME,
    AUTHENTICATOR_SHORT_APP_NAME,
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';

import { SignupType } from '../../signup/interfaces';
import Benefits from '../Benefits';
import { planCardFeatureProps } from '../PlanCardSelector';
import SignupHeaderV2 from '../SignupHeaderV2';
import { getBenefits, getGenericBenefits, getGenericFeatures, getJoinString } from '../configuration/helper';
import CustomStep from '../defaultCustomStep/CustomStep';
import type { SignupConfiguration } from '../interface';
import setupAccount from '../mail/account-setup.svg';

export const getAuthenticatorConfiguration = ({ defaultPlan }: { defaultPlan?: string }): SignupConfiguration => {
    const appName = AUTHENTICATOR_APP_NAME;
    const logo = <Logo appName={APPS.PROTONAUTHENTICATOR} />;

    const title = <SignupHeaderV2></SignupHeaderV2>;

    const features = getGenericFeatures(false);
    const benefitItems = getGenericBenefits();
    const benefits = benefitItems && (
        <div>
            <div className="text-lg text-semibold">{getBenefits(appName)}</div>
            <Benefits className="mt-5 mb-5" features={benefitItems} />
            <div>{getJoinString()}</div>
        </div>
    );

    const planCards: SignupConfiguration['planCards'] = {
        [Audience.B2B]: [],
        [Audience.B2C]: [
            {
                plan: PLANS.FREE,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={[]} />,
                type: 'standard' as const,
                guarantee: false,
            },
            {
                plan: PLANS.BUNDLE,
                subsection: (
                    <>
                        <div className="color-weak text-left text-sm mb-1">
                            {c('Plan description')
                                .t`All premium features from ${BRAND_NAME} ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`}
                        </div>
                        <AppsLogos
                            fullWidth
                            apps={[
                                APPS.PROTONMAIL,
                                APPS.PROTONCALENDAR,
                                APPS.PROTONDRIVE,
                                APPS.PROTONVPN_SETTINGS,
                                APPS.PROTONPASS,
                                APPS.PROTONDOCS,
                            ]}
                        />
                    </>
                ),
                type: 'standard' as const,
                guarantee: true,
            },
        ],
    };

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
            if (defaultPlan && [PLANS.FREE].includes(defaultPlan as PLANS)) {
                return {
                    plan: defaultPlan as PLANS,
                    cycle: CYCLE.YEARLY,
                };
            }

            return {
                plan: PLANS.FREE,
                cycle: CYCLE.YEARLY,
            };
        })(),
        onboarding: {
            user: false,
            signup: true,
        },
        product: APPS.PROTONAUTHENTICATOR,
        shortProductAppName: AUTHENTICATOR_SHORT_APP_NAME,
        productAppName: appName,
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
