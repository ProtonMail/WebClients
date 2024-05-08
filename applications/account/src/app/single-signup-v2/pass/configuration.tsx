import { c } from 'ttag';

import { IconName, PassLogo } from '@proton/components/components';
import { getPassKeys, getPassMonitor } from '@proton/components/containers/payments/features/highlights';
import { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import {
    FREE_VAULTS,
    get2FAAuthenticator,
    get2FAAuthenticatorText,
    getDevices,
    getDevicesAndAliases,
    getLoginsAndNotes,
    getSecureSharingText,
    getSecureVaultSharing,
    getSecureVaultSharingWith,
    getUnlimitedVaultSharingText,
    getVaultSharing,
} from '@proton/components/containers/payments/features/pass';
import {
    getPassBusinessSignupPlan,
    getPassEssentialsSignupPlan,
} from '@proton/components/containers/payments/features/plan';
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
    PLAN_NAMES,
    SSO_PATHS,
    VPN_APP_NAME,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import { Audience, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import onboardingFamilyPlan from '@proton/styles/assets/img/onboarding/familyPlan.svg';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { SignupType } from '../../signup/interfaces';
import Benefits, { BenefitItem } from '../Benefits';
import BundlePlanSubSection from '../BundlePlanSubSection';
import FeatureListPlanCardSubSection from '../FeatureListPlanCardSubSection';
import LetsTalkSubsection from '../LetsTalkSubsection';
import { planCardFeatureProps } from '../PlanCardSelector';
import { getBasedString, getBenefits, getGenericFeatures, getJoinString } from '../configuration/helper';
import { SignupConfiguration, SignupMode } from '../interface';
import setupAccount from '../mail/account-setup.svg';
import CustomStep from './CustomStep';
import { getInfo } from './InstallExtensionStep';
import recoveryKit from './recovery-kit.svg';

export const getPassB2BBenefits = (isPaidPass: boolean): BenefitItem[] => {
    return [
        {
            key: 1,
            text: c('pass_signup_2023: Info').t`Open source and audited`,
            icon: {
                name: 'magnifier' as const,
            },
        },
        ...(isPaidPass
            ? [
                  {
                      key: 2,
                      text: getUnlimitedVaultSharingText(),
                      icon: {
                          name: 'vault' as const,
                      },
                  },
                  {
                      key: 3,
                      text: getBasedString(),
                      icon: {
                          name: 'shield' as const,
                      },
                  },
              ]
            : [
                  {
                      key: 4,
                      text: c('pass_signup_2023: Info').t`End-to-end encrypted notes`,
                      icon: {
                          name: 'lock' as const,
                      },
                  },
              ]),
        {
            key: 5,
            text: c('pass_signup_2023: Info').t`From the team that knows encryption`,
            icon: {
                name: 'lock' as const,
            },
        },
    ].filter(isTruthy);
};

export const getPassBenefits = (isPaidPass: boolean): BenefitItem[] => {
    return [
        {
            key: 1,
            text: c('pass_signup_2023: Info').t`Works on all devices`,
            icon: {
                name: 'mobile' as const,
            },
        },
        {
            key: 2,
            text: c('pass_signup_2023: Info').t`Aliases for email protection from breaches`,
            icon: {
                name: 'alias' as const,
            },
        },
        ...(isPaidPass
            ? [
                  {
                      key: 3,
                      text: getSecureSharingText('multiple'),
                      icon: {
                          name: 'arrow-up-from-square' as const,
                      },
                  },
                  {
                      key: 4,
                      text: get2FAAuthenticatorText(),
                      icon: {
                          name: 'key' as const,
                      },
                  },
                  {
                      key: 5,
                      text: c('pass_signup_2023: Info').t`Alerts for compromised emails and vulnerable passwords`,
                      icon: {
                          name: 'shield' as const,
                      },
                  },
              ]
            : [
                  {
                      key: 3,
                      text: getSecureSharingText(FREE_VAULTS),
                      icon: {
                          name: 'arrow-up-from-square' as const,
                      },
                  },
                  {
                      key: 4,
                      text: c('pass_signup_2023: Info').t`Alerts for vulnerable passwords`,
                      icon: {
                          name: 'shield' as const,
                      },
                  },
              ]),
        {
            key: 20,
            text: c('pass_signup_2023: Info').t`Passkeys supported on all devices`,
            icon: {
                name: 'pass-passkey' as const,
            },
        },
        {
            key: 21,
            text: c('pass_signup_2023: Info').t`Secured by end-to-end encryption`,
            icon: {
                name: 'lock' as const,
            },
        },
    ].filter(isTruthy);
};

export const getFreePassFeatures = () => {
    return [getLoginsAndNotes(), getDevices(), getPassKeys(true), getSecureVaultSharingWith(FREE_VAULTS)];
};

export const getCustomPassFeatures = () => {
    return [
        getLoginsAndNotes(),
        getDevicesAndAliases(),
        getPassKeys(true),
        getSecureVaultSharing(),
        getPassMonitor(true),
        get2FAAuthenticator(true),
    ];
};

export const getPassConfiguration = ({
    mode,
    audience,
    hideFreePlan,
    isLargeViewport,
    vpnServersCountData,
    isPaidPass,
    isPaidPassVPNBundle,
    plansMap,
}: {
    mode: SignupMode;
    audience: Audience.B2B | Audience.B2C;
    hideFreePlan: boolean;
    isLargeViewport: boolean;
    vpnServersCountData: VPNServersCountData;
    isPaidPass: boolean;
    isPaidPassVPNBundle: boolean;
    plansMap?: PlansMap;
}): SignupConfiguration => {
    const logo = <PassLogo />;

    const title = c('pass_signup_2023: Info').t`Encrypted password manager that also protects your identity`;
    const b2bTitle = c('pass_signup_2023: Info').t`Get the security and features your business needs`;
    const inviteTitle = c('pass_signup_2023: Info').t`You have been invited to join ${PASS_APP_NAME}`;
    const onboardingTitle = c('pass_signup_2023: Info').t`Unlock ${PASS_APP_NAME} premium features by upgrading`;

    const features = getGenericFeatures(isLargeViewport);
    const planTitle = plansMap?.[PLANS.PASS_PRO]?.Title || PLAN_NAMES[PLANS.PASS_PRO];

    const planCards: SignupConfiguration['planCards'] = {
        [Audience.B2B]: [
            {
                plan: PLANS.PASS_PRO,
                subsection: (
                    <FeatureListPlanCardSubSection
                        description={c('pass_signup_2023: Info')
                            .t`Essential protection and secure collaboration for unlimited users`}
                        features={
                            <PlanCardFeatureList
                                {...planCardFeatureProps}
                                features={getPassEssentialsSignupPlan(plansMap?.[PLANS.PASS_PRO]).features}
                            />
                        }
                    />
                ),
                type: 'standard' as const,
                guarantee: false,
            },
            {
                plan: PLANS.PASS_BUSINESS,
                subsection: (
                    <FeatureListPlanCardSubSection
                        description={c('pass_signup_2023: Info')
                            .t`Advanced protection that goes beyond industry standards`}
                        features={
                            <div>
                                <div
                                    className={clsx(
                                        planCardFeatureProps.className,
                                        planCardFeatureProps.itemClassName,
                                        'text-left'
                                    )}
                                >
                                    {c('pass_signup_2023: Info').t`Everything from ${planTitle}, plus...`}
                                </div>
                                <PlanCardFeatureList
                                    {...planCardFeatureProps}
                                    tooltip={true}
                                    features={getPassBusinessSignupPlan(plansMap?.[PLANS.PASS_PRO]).features}
                                />
                            </div>
                        }
                    />
                ),
                type: 'best' as const,
                guarantee: true,
            },
            {
                plan: PLANS.ENTERPRISE,
                subsection: <LetsTalkSubsection vpnServersCountData={vpnServersCountData} />,
                type: 'standard' as const,
                guarantee: true,
                interactive: false,
            },
        ],
        [Audience.B2C]: [
            !hideFreePlan && {
                plan: PLANS.FREE,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getFreePassFeatures()} />,
                type: 'standard' as const,
                guarantee: false,
            },
            {
                plan: PLANS.PASS_PLUS,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getCustomPassFeatures()} />,
                type: 'best' as const,
                guarantee: true,
            },
            {
                plan: PLANS.BUNDLE,
                subsection: <BundlePlanSubSection vpnServersCountData={vpnServersCountData} />,
                type: 'standard' as const,
                guarantee: true,
            },
        ].filter(isTruthy),
    };

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
                            getDevicesAndAliases(),
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

        const benefitItems = audience === Audience.B2B ? getPassB2BBenefits(isPaidPass) : getPassBenefits(isPaidPass);
        return (
            benefitItems && (
                <div>
                    <div className="text-lg text-semibold">{getBenefits(PASS_APP_NAME)}</div>
                    <Benefits className="mt-5 mb-5" features={benefitItems} />
                    <div>{getJoinString(audience)}</div>
                </div>
            )
        );
    })();

    return {
        logo,
        title: {
            [SignupMode.Default]: audience === Audience.B2B ? b2bTitle : title,
            [SignupMode.Onboarding]: onboardingTitle,
            [SignupMode.Invite]: inviteTitle,
            [SignupMode.MailReferral]: title,
        }[mode],
        features,
        benefits,
        planCards,
        audience,
        audiences: [
            {
                value: Audience.B2C,
                pathname: SSO_PATHS.PASS_SIGNUP,
                title: c('pass_signup_2023: title').t`For individuals`,
                defaultPlan: PLANS.PASS_PLUS,
            },
            {
                value: Audience.B2B,
                pathname: SSO_PATHS.PASS_SIGNUP_B2B,
                title: c('pass_signup_2023: title').t`For businesses`,
                defaultPlan: PLANS.PASS_BUSINESS,
            },
        ],
        signupTypes: [SignupType.Email],
        generateMnemonic: true,
        defaults: {
            plan: (() => {
                if (mode === SignupMode.Invite) {
                    return PLANS.FREE;
                }
                if (audience === Audience.B2B) {
                    return PLANS.PASS_BUSINESS;
                }
                return PLANS.PASS_PLUS;
            })(),
            cycle: CYCLE.YEARLY,
        },
        onboarding: {
            user: true,
            signup: true,
        },
        product: APPS.PROTONPASS,
        shortProductAppName: PASS_SHORT_APP_NAME,
        productAppName: PASS_APP_NAME,
        setupImg: <img src={setupAccount} alt="" />,
        preload: (
            <>
                <link rel="prefetch" href={recoveryKit} as="image" />
                <link rel="prefetch" href={setupAccount} as="image" />
                {audience === Audience.B2B && <link rel="prefetch" href={onboardingFamilyPlan} as="image" />}
                {getInfo(null, noop).preload}
            </>
        ),
        CustomStep,
        cycles: [CYCLE.MONTHLY, CYCLE.YEARLY],
    };
};
