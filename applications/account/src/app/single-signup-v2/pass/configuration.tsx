import { c } from 'ttag';

import { IconName, PassLogo } from '@proton/components/components';
import { getSentinel } from '@proton/components/containers/payments/features/highlights';
import { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import {
    get2FAAuthenticator,
    get2FAAuthenticatorText,
    getCreditCards,
    getDevices,
    getHideMyEmailAliases,
    getItems,
    getLoginsAndNotes,
    getVaultSharing,
    getVaultSharingText,
} from '@proton/components/containers/payments/features/pass';
import {
    getAdvancedVPNCustomizations,
    getNetShield,
    getProtectDevices,
    getVPNSpeed,
} from '@proton/components/containers/payments/features/vpn';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import {
    APPS,
    CYCLE,
    PASS_APP_NAME,
    PASS_SHORT_APP_NAME,
    PLANS,
    VPN_APP_NAME,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import { VPNServersCountData } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { SignupType } from '../../signup/interfaces';
import Benefits, { BenefitItem } from '../Benefits';
import BundlePlanSubSection from '../BundlePlanSubSection';
import { PlanCard, planCardFeatureProps } from '../PlanCardSelector';
import { getBenefits, getGenericBenefits, getGenericFeatures, getJoinString } from '../configuration/helper';
import { SignupConfiguration, SignupMode } from '../interface';
import CustomStep from './CustomStep';
import { getInfo } from './InstallExtensionStep';
import setupPass from './onboarding.svg';
import recoveryKit from './recovery-kit.svg';

export const getPassBenefits = (isPaidPass: boolean): BenefitItem[] => {
    return [
        {
            key: 1,
            text: c('pass_signup_2023: Info').t`Hide-my-email aliases protect your email from data breaches`,
            icon: {
                name: 'alias' as const,
            },
        },
        ...(isPaidPass
            ? [
                  {
                      key: 2,
                      text: get2FAAuthenticatorText(),
                      icon: {
                          name: 'key' as const,
                      },
                  },
                  {
                      key: 3,
                      text: getVaultSharingText(10),
                      icon: {
                          name: 'lock' as const,
                      },
                  },
              ]
            : [
                  {
                      key: 2,
                      text: c('pass_signup_2023: Info').t`End-to-end encrypted notes`,
                      icon: {
                          name: 'lock' as const,
                      },
                  },
              ]),
        ...getGenericBenefits(),
    ].filter(isTruthy);
};

export const getFreePassFeatures = () => {
    return [getLoginsAndNotes(), getDevices(), getHideMyEmailAliases(10), getVaultSharing(3)];
};

export const getCustomPassFeatures = (isSentinelPassplusEnabled: boolean) => {
    return [
        getLoginsAndNotes(),
        getDevices(),
        getHideMyEmailAliases('unlimited'),
        get2FAAuthenticator(true),
        getItems(),
        isSentinelPassplusEnabled ? getSentinel() : getCreditCards(),
        getVaultSharing(10),
    ];
};

export const getPassConfiguration = ({
    mode,
    hideFreePlan,
    isDesktop,
    vpnServersCountData,
    isPaidPass,
    isPaidPassVPNBundle,
    isSentinelPassplusEnabled,
}: {
    mode: SignupMode;
    hideFreePlan: boolean;
    isDesktop: boolean;
    vpnServersCountData: VPNServersCountData;
    isPaidPass: boolean;
    isPaidPassVPNBundle: boolean;
    isSentinelPassplusEnabled: boolean;
}): SignupConfiguration => {
    const logo = <PassLogo />;

    const title = c('pass_signup_2023: Info').t`Encrypted password manager that also protects your identity`;
    const inviteTitle = c('pass_signup_2023: Info').t`You have been invited to join ${PASS_APP_NAME}`;
    const onboardingTitle = c('pass_signup_2023: Info').t`Unlock ${PASS_APP_NAME} premium features by upgrading`;

    const features = getGenericFeatures(isDesktop);

    const planCards: PlanCard[] = [
        !hideFreePlan && {
            plan: PLANS.FREE,
            subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getFreePassFeatures()} />,
            type: 'standard' as const,
            guarantee: false,
        },
        {
            plan: PLANS.PASS_PLUS,
            subsection: (
                <PlanCardFeatureList
                    {...planCardFeatureProps}
                    features={getCustomPassFeatures(isSentinelPassplusEnabled)}
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

    const benefits = (() => {
        if (isPaidPassVPNBundle) {
            const getBenefitItems = (items: PlanCardFeatureDefinition[]) => {
                return items.map(
                    (item, i): BenefitItem => ({
                        ...item,
                        key: i,
                        icon: { name: item.icon as IconName },
                    })
                );
            };
            return (
                <div>
                    <div className="text-lg text-semibold">{getBenefits(PASS_APP_NAME)}</div>
                    <Benefits
                        className="mt-5 mb-5"
                        features={getBenefitItems([
                            getLoginsAndNotes(),
                            getHideMyEmailAliases('unlimited'),
                            get2FAAuthenticator(true),
                            getVaultSharing(10),
                        ])}
                    />
                    <div className="text-lg text-semibold">{getBenefits(VPN_APP_NAME)}</div>
                    <Benefits
                        className="mt-5 mb-5"
                        features={getBenefitItems([
                            getVPNSpeed('highest'),
                            getProtectDevices(VPN_CONNECTIONS),
                            getNetShield(true),
                            getAdvancedVPNCustomizations(true),
                        ])}
                    />
                    <div>{getJoinString()}</div>
                </div>
            );
        }

        const benefitItems = getPassBenefits(isPaidPass);
        return (
            benefitItems && (
                <div>
                    <div className="text-lg text-semibold">{getBenefits(PASS_APP_NAME)}</div>
                    <Benefits className="mt-5 mb-5" features={benefitItems} />
                    <div>{getJoinString()}</div>
                </div>
            )
        );
    })();

    return {
        logo,
        title: {
            [SignupMode.Default]: title,
            [SignupMode.Onboarding]: onboardingTitle,
            [SignupMode.Invite]: inviteTitle,
        }[mode],
        features,
        benefits,
        planCards,
        signupTypes: [SignupType.Email],
        generateMnemonic: true,
        defaults: {
            plan: mode === SignupMode.Invite ? PLANS.FREE : PLANS.PASS_PLUS,
            cycle: CYCLE.YEARLY,
        },
        onboarding: {
            user: true,
            signup: true,
        },
        product: APPS.PROTONPASS,
        shortProductAppName: PASS_SHORT_APP_NAME,
        productAppName: PASS_APP_NAME,
        setupImg: <img src={setupPass} alt="" />,
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
