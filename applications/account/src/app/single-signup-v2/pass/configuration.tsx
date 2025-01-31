import { c } from 'ttag';

import type { IconName } from '@proton/components';
import { PassLogo } from '@proton/components';
import { getPassKeys, getPassMonitor } from '@proton/components/containers/payments/features/highlights';
import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import {
    FREE_VAULTS,
    PAID_VAULTS,
    get2FAAuthenticator,
    get2FAAuthenticatorText,
    getActivityLogText,
    getAdvancedAliasFeatures,
    getDevices,
    getDevicesAndAliases,
    getLoginsAndNotes,
    getLoginsAndNotesText,
    getPassUsers,
    getPassUsersText,
    getSecureSharingTextEmpty,
    getSecureVaultSharing,
    getTeamPoliciesText,
    getUnlimitedHideMyEmailAliasesText,
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
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import {
    APPS,
    BRAND_NAME,
    FAMILY_MAX_USERS,
    PASS_APP_NAME,
    PASS_SHORT_APP_NAME,
    SSO_PATHS,
    VPN_APP_NAME,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import type { Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';
import onboardingFamilyPlan from '@proton/styles/assets/img/onboarding/familyPlan.svg';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { SignupType } from '../../signup/interfaces';
import type { BenefitItem } from '../Benefits';
import Benefits from '../Benefits';
import BundlePlanSubSection from '../BundlePlanSubSection';
import FeatureListPlanCardSubSection from '../FeatureListPlanCardSubSection';
import LetsTalkSubsection from '../LetsTalkSubsection';
import { planCardFeatureProps } from '../PlanCardSelector';
import SignupHeaderV2 from '../SignupHeaderV2';
import {
    getAliasesEmailProtectionBenefit,
    getBasedInSwitzerlandGDPRBenefit,
    getBenefits,
    getBundleVisionaryBenefits,
    getDeviceSyncBenefit,
    getGenericFeatures,
    getJoinString,
    getTeamKnowsEncryptionBenefit,
    getUnlimitedPasswordsBenefit,
    getWorksOnAllDevicesBenefit,
} from '../configuration/helper';
import type { SignupConfiguration } from '../interface';
import { SignupMode } from '../interface';
import setupAccount from '../mail/account-setup.svg';
import CustomStep from './CustomStep';
import { getInfo } from './InstallExtensionStep';
import recoveryKit from './recovery-kit.svg';

const getPassBenefitsTitle = (plan: PLANS | undefined) => {
    if (plan === PLANS.PASS_FAMILY) {
        return getBenefits(`${PASS_SHORT_APP_NAME} Family`);
    }

    if (plan === PLANS.BUNDLE) {
        return getBenefits(BRAND_NAME);
    }

    return getBenefits(PASS_APP_NAME);
};

const getUserAccountsBenefit = (): BenefitItem => {
    return {
        key: `user-accounts`,
        text: getPassUsersText(6),
        icon: {
            name: 'user-plus',
        },
    };
};

const getAdminPanelBenefit = (): BenefitItem => {
    return {
        key: `admin-panel`,
        text: c('pass_signup_2024: Info').t`Admin panel to manage users and subscription`,
        icon: {
            name: 'cog-wheel',
        },
    };
};

const getAliasesBenefit = (): BenefitItem => {
    return {
        key: `aliases`,
        text: c('pass_signup_2023: Info').t`Aliases for email protection from breaches`,
        icon: {
            name: 'alias',
        },
    };
};

const getSecureSharingBenefit = (): BenefitItem => {
    return {
        key: `secure-sharing`,
        text: getSecureSharingTextEmpty(true),
        icon: {
            name: 'arrow-up-from-square',
        },
    };
};

const get2FABenefit = (): BenefitItem => {
    return {
        key: `2fa`,
        text: get2FAAuthenticatorText(),
        icon: {
            name: 'key',
        },
    };
};

const getAlertsBenefit = (): BenefitItem => {
    return {
        key: `alerts`,
        text: c('pass_signup_2023: Info').t`Alerts for compromised emails and vulnerable passwords`,
        icon: {
            name: 'shield',
        },
    };
};

const getPasskeysBenefit = (): BenefitItem => {
    return {
        key: `passkeys`,
        text: c('pass_signup_2023: Info').t`Passkeys supported on all devices`,
        icon: {
            name: 'pass-passkey',
        },
    };
};

const getEncryptionBenefit = (): BenefitItem => {
    return {
        key: `encryption`,
        text: c('pass_signup_2023: Info').t`Secured by end-to-end encryption`,
        icon: {
            name: 'lock',
        },
    };
};

const getAdvancedAliasBenefit = (): BenefitItem => {
    return {
        key: `advanced-alias`,
        text: c('pass_signup_2024: Info').t`Advanced alias features (powered by SimpleLogin)`,
        icon: {
            name: 'brand-simple-login',
        },
    };
};

const getOpenSourceAndAuditedBenefit = (): BenefitItem => {
    return {
        key: 'open-source-and-audited',
        text: c('pass_signup_2023: Info').t`Open source and audited`,
        icon: {
            name: 'magnifier' as const,
        },
    };
};

const getLoginsAndNotesBenefit = (): BenefitItem => {
    return {
        key: 'notes',
        text: getLoginsAndNotesText('paid'),
        icon: {
            name: 'note' as const,
        },
    };
};

const getEmailAliasesBenefit = (): BenefitItem => {
    return {
        key: 'email-aliases',
        text: getUnlimitedHideMyEmailAliasesText(),
        icon: {
            name: 'eye-slash' as const,
        },
    };
};

const getSecureLinkAndVaultSharingBenefit = (): BenefitItem => {
    return {
        key: 'secure-vault-sharing',
        text: getSecureSharingTextEmpty(true),
        icon: {
            name: 'arrow-up-from-square' as const,
        },
    };
};

const getTeamPoliciesBenefit = (): BenefitItem => {
    return {
        key: 'team-policies',
        text: getTeamPoliciesText(),
        icon: {
            name: 'users' as const,
        },
    };
};

const getActivityLogBenefit = (): BenefitItem => {
    return {
        key: 'activity-log',
        text: getActivityLogText(),
        icon: {
            name: 'list-bullets' as const,
        },
    };
};

const getAdvancedAccountProtectionBenefit = (): BenefitItem => {
    return {
        key: 'advanced-account-protection',
        text: c('pass_signup_2024: Info').t`Advanced account protection`,
        icon: {
            name: 'lock' as const,
        },
    };
};

export const getPassBenefits = (
    plan: PLANS | undefined,
    audience: Audience | undefined,
    isPaidPass: boolean
): BenefitItem[] => {
    if (plan === PLANS.BUNDLE || plan === PLANS.VISIONARY) {
        return getBundleVisionaryBenefits();
    }

    if (plan === PLANS.PASS_FAMILY) {
        return [
            getUserAccountsBenefit(),
            getAdminPanelBenefit(),
            getWorksOnAllDevicesBenefit(),
            getAliasesBenefit(),
            getAdvancedAliasBenefit(),
            getSecureSharingBenefit(),
            get2FABenefit(),
            getAlertsBenefit(),
            getPasskeysBenefit(),
            getEncryptionBenefit(),
        ];
    }

    if (plan === PLANS.PASS_PRO) {
        return [
            getOpenSourceAndAuditedBenefit(),
            getBasedInSwitzerlandGDPRBenefit(),
            getTeamKnowsEncryptionBenefit(),
            getLoginsAndNotesBenefit(),
            getEmailAliasesBenefit(),
            get2FABenefit(),
            getSecureLinkAndVaultSharingBenefit(),
        ];
    }

    if (plan === PLANS.PASS_BUSINESS) {
        return [
            getOpenSourceAndAuditedBenefit(),
            getBasedInSwitzerlandGDPRBenefit(),
            getTeamKnowsEncryptionBenefit(),
            getLoginsAndNotesBenefit(),
            getEmailAliasesBenefit(),
            get2FABenefit(),
            getSecureLinkAndVaultSharingBenefit(),
            getTeamPoliciesBenefit(),
            getActivityLogBenefit(),
            getAdvancedAccountProtectionBenefit(),
        ];
    }

    if (isPaidPass) {
        return [
            getWorksOnAllDevicesBenefit(),
            getAliasesBenefit(),
            getAdvancedAliasBenefit(),
            getSecureLinkAndVaultSharingBenefit(),
            get2FABenefit(),
            {
                key: 'alerts-for-compromised-emails-and-vulnerable-passwords',
                text: c('pass_signup_2023: Info').t`Alerts for compromised emails and vulnerable passwords`,
                icon: {
                    name: 'shield' as const,
                },
            },
            getPasskeysBenefit(),
            getEncryptionBenefit(),
        ];
    }

    return [
        getUnlimitedPasswordsBenefit(),
        getDeviceSyncBenefit(),
        getAliasesEmailProtectionBenefit(),
        getPasskeysBenefit(),
        getEncryptionBenefit(),
    ];
};

export const getFreePassFeatures = () => {
    return [
        getPassUsers(1),
        getLoginsAndNotes('free'),
        getDevices(),
        getPassKeys(true),
        getSecureVaultSharing(FREE_VAULTS),
    ];
};

export const getCustomPassFeatures = () => {
    return [
        getPassUsers(1),
        getLoginsAndNotes('paid'),
        getDevicesAndAliases(),
        getAdvancedAliasFeatures(true),
        getPassKeys(true),
        getSecureVaultSharing(PAID_VAULTS, true),
        getPassMonitor(true),
        get2FAAuthenticator(true),
    ];
};

export const getCustomPassLifetimeFeatures = () => {
    return [
        {
            key: 'pass-lifetime-one-time-payment',
            text: c('pass_signup_2024: Info').t`One-time payment, lifetime deal`,
            included: true,
        },
        ...getCustomPassFeatures(),
    ];
};

export const getCustomPassFamilyFeatures = () => {
    return [
        getPassUsers(FAMILY_MAX_USERS),
        getLoginsAndNotes('paid'),
        getDevicesAndAliases(),
        getAdvancedAliasFeatures(true),
        getPassKeys(true),
        getSecureVaultSharing(PAID_VAULTS, true),
        getPassMonitor(true),
        get2FAAuthenticator(true),
    ];
};

export const getPassConfiguration = ({
    showPassFamily,
    mode,
    audience,
    hideFreePlan,
    isLargeViewport,
    vpnServersCountData,
    isPaidPass,
    isPaidPassVPNBundle,
    plansMap,
    plan,
}: {
    showPassFamily: boolean;
    mode: SignupMode;
    audience: Audience.B2B | Audience.B2C;
    hideFreePlan: boolean;
    isLargeViewport: boolean;
    vpnServersCountData: VPNServersCountData;
    isPaidPass: boolean;
    isPaidPassVPNBundle: boolean;
    plansMap?: PlansMap;
    plan: Plan | undefined;
}): SignupConfiguration => {
    const logo = <PassLogo />;

    const title = c('pass_signup_2023: Info').t`Encrypted password manager that also protects your identity`;
    const b2bTitle = c('pass_signup_2023: Info').t`Get the security and features your business needs`;
    const inviteTitle = c('pass_signup_2023: Info').t`You have been invited to join ${PASS_APP_NAME}`;
    const simpleLoginTitle = c('pass_signup_2023: Info').t`Start using ${PASS_APP_NAME}`;

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
                plan: PLANS.PASS,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getCustomPassFeatures()} />,
                type: 'best' as const,
                guarantee: true,
            },
            showPassFamily && {
                plan: PLANS.PASS_FAMILY,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getCustomPassFamilyFeatures()} />,
                type: 'standard' as const,
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
                            getLoginsAndNotes('paid'),
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

        const benefitItems = getPassBenefits(plan?.Name as PLANS, audience, isPaidPass);
        const benefitTitle = getPassBenefitsTitle(plan?.Name as PLANS);

        return (
            benefitItems && (
                <div>
                    <div className="text-lg text-semibold">{benefitTitle}</div>
                    <Benefits className="mt-5 mb-5" features={benefitItems} />
                    <div>{getJoinString(audience)}</div>
                </div>
            )
        );
    })();

    return {
        logo,
        title: {
            [SignupMode.Default]: <SignupHeaderV2>{audience === Audience.B2B ? b2bTitle : title}</SignupHeaderV2>,
            [SignupMode.Invite]: <SignupHeaderV2 className="max-w-full">{inviteTitle}</SignupHeaderV2>,
            [SignupMode.MailReferral]: <SignupHeaderV2>{title}</SignupHeaderV2>,
            [SignupMode.PassSimpleLogin]: <SignupHeaderV2>{simpleLoginTitle}</SignupHeaderV2>,
        }[mode],
        features,
        benefits,
        planCards,
        audience,
        audiences: [
            {
                value: Audience.B2C,
                locationDescriptor: { pathname: SSO_PATHS.PASS_SIGNUP },
                title: c('pass_signup_2023: title').t`For individuals`,
                defaultPlan: PLANS.PASS,
            },
            {
                value: Audience.B2B,
                locationDescriptor: { pathname: SSO_PATHS.PASS_SIGNUP_B2B },
                title: c('pass_signup_2023: title').t`For businesses`,
                defaultPlan: PLANS.PASS_BUSINESS,
            },
        ],
        signupTypes: [SignupType.Email, SignupType.Username],
        generateMnemonic: true,
        defaults: {
            plan: (() => {
                if (mode === SignupMode.Invite || mode === SignupMode.PassSimpleLogin) {
                    return PLANS.FREE;
                }
                if (audience === Audience.B2B) {
                    return PLANS.PASS_BUSINESS;
                }
                return PLANS.PASS;
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
