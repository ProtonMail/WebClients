import { c } from 'ttag';

import { AppsLogos, MailLogo } from '@proton/components';
import { getManageUserPermissionsAndAccessFeature } from '@proton/components/containers/payments/features/b2b';
import { getCalendarAppFeature } from '@proton/components/containers/payments/features/calendar';
import { getSecurePersonalAndSharedCalendarFeature } from '@proton/components/containers/payments/features/calendar';
import {
    getCloudStorageAndSharingFeature,
    getFreeMailStorageFeature,
    getShortStorageFeatureB2B,
    getStorageFeature,
} from '@proton/components/containers/payments/features/drive';
import {
    getAdvancedAccountProtectionFeature,
    getAllPremiumServices,
    getScribeFeature,
    getSupport,
    getUsersFeature,
} from '@proton/components/containers/payments/features/highlights';
import {
    getFoldersAndLabelsFeature,
    getNAddressesFeature,
    getNDomainsFeature,
    getNMessagesFeature,
} from '@proton/components/containers/payments/features/mail';
import { getPasswordManagerToSecureCredentialsFeature } from '@proton/components/containers/payments/features/pass';
import { getB2BVPNConnectionsPerUserFeature } from '@proton/components/containers/payments/features/vpn';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { CYCLE, type FreePlanDefault, PLANS, type Plan, type PlansMap } from '@proton/payments';
import {
    APPS,
    BRAND_NAME,
    FAMILY_MAX_USERS,
    MAIL_APP_NAME,
    MAIL_SHORT_APP_NAME,
    SSO_PATHS,
} from '@proton/shared/lib/constants';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { SignupType } from '../../signup/interfaces';
import type { BenefitItem } from '../Benefits';
import Benefits from '../Benefits';
import FeatureListPlanCardSubSection from '../FeatureListPlanCardSubSection';
import LetsTalkGenericSubSection from '../LetsTalkGenericSubsection';
import { planCardFeatureProps } from '../PlanCardSelector';
import SignupHeaderV2 from '../SignupHeaderV2';
import {
    getAdvancedSecurityBenefit,
    getAppsIncludedBenefit,
    getAppsMailIncludedBenefit,
    getBasedInSwitzerlandGDPRBenefit,
    getBenefits,
    getBuiltInEncryptionBenefit,
    getBundleVisionaryBenefits,
    getEmailAliasesBenefit,
    getFamilyDuoBenefits,
    getGenericFeatures,
    getISO27001CertifiedBenefit,
    getJoinString,
    getOpenSourceAndAuditedBenefit,
    getSwissPrivacyLawsBenefit,
    getTeamKnowsEncryptionBenefit,
    getWorksOnAllDevicesBenefit,
} from '../configuration/helper';
import CustomStep from '../defaultCustomStep/CustomStep';
import type { PlanParameters, SignupConfiguration, SignupParameters2 } from '../interface';
import { SignupMode } from '../interface';
import PorkbunHeader from './PorkbunHeader';
import setupAccount from './account-setup.svg';

const getMailBenefitsTitle = (plan: PLANS | undefined, audience: Audience | undefined) => {
    if (plan === PLANS.BUNDLE_PRO_2024 || plan === PLANS.BUNDLE || plan === PLANS.FAMILY) {
        return getBenefits(BRAND_NAME);
    }
    if (audience === Audience.B2B) {
        return getBenefits(MAIL_APP_NAME);
    }
    return c('Signup: Info').t`The only email service with:`;
};

export const getMailBenefits = (plan: PLANS | undefined, audience: Audience | undefined): BenefitItem[] => {
    if (plan === PLANS.BUNDLE || plan === PLANS.VISIONARY) {
        return getBundleVisionaryBenefits();
    }

    if (plan === PLANS.FAMILY || plan === PLANS.DUO) {
        return getFamilyDuoBenefits();
    }

    if (plan === PLANS.BUNDLE_PRO_2024) {
        return [
            getOpenSourceAndAuditedBenefit(),
            getBasedInSwitzerlandGDPRBenefit(),
            getISO27001CertifiedBenefit(),
            getTeamKnowsEncryptionBenefit(),
            getWorksOnAllDevicesBenefit(),
            getAppsIncludedBenefit(),
        ];
    }

    if (audience === Audience.B2B) {
        return [
            getOpenSourceAndAuditedBenefit(),
            getBasedInSwitzerlandGDPRBenefit(),
            getISO27001CertifiedBenefit(),
            getTeamKnowsEncryptionBenefit(),
            getWorksOnAllDevicesBenefit(),
            getAppsMailIncludedBenefit(),
        ];
    }

    return [
        getBuiltInEncryptionBenefit(),
        getSwissPrivacyLawsBenefit(),
        getEmailAliasesBenefit(),
        getAdvancedSecurityBenefit(),
        getAppsMailIncludedBenefit(),
    ];
};

export const getFreeMailFeatures = (freePlan: FreePlanDefault) => {
    return [getFreeMailStorageFeature(freePlan), getNAddressesFeature({ n: 1 })];
};

export const getCustomMailFeatures = (plan: Plan | undefined, freePlan: FreePlanDefault) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeature(plan.MaxSpace, {
            freePlan,
            family: plan.Name === PLANS.FAMILY,
            duo: plan.Name === PLANS.DUO,
        }),
        plan.Name === PLANS.FAMILY && getUsersFeature(FAMILY_MAX_USERS),
        (plan.Name === PLANS.BUNDLE || plan.Name === PLANS.FAMILY) && getAllPremiumServices(),
        getNAddressesFeature({ n: plan.MaxAddresses }),
        getFoldersAndLabelsFeature('unlimited'),
        getNMessagesFeature('unlimited'),
        getNDomainsFeature({ n: plan.MaxDomains }),
        getSupport('priority'),
        plan.Name === PLANS.MAIL && getCalendarAppFeature(),
    ].filter(isTruthy);
};

export const getCustomMailPlusKeyFeatures = (plan: Plan | undefined, freePlan: FreePlanDefault) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeature(plan.MaxSpace, {
            freePlan,
        }),
        getNAddressesFeature({ n: plan.MaxAddresses }),
    ];
};

export const getCustomBundleKeyFeatures = (plan: Plan | undefined, freePlan: FreePlanDefault) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeature(plan.MaxSpace, {
            freePlan,
        }),
        getAllPremiumServices(),
    ];
};

export const getCustomFamilyKeyFeatures = (plan: Plan | undefined, freePlan: FreePlanDefault) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeature(plan.MaxSpace, {
            freePlan,
            family: plan.Name === PLANS.FAMILY,
        }),
        getUsersFeature(FAMILY_MAX_USERS),
        getAllPremiumServices(),
    ];
};

const getPorkbunFeatures = (plan: Plan | undefined) => {
    if (!plan) {
        return [];
    }

    const isMailEssentials = plan.Name === PLANS.MAIL_PRO;
    const isPBS = plan.Name === PLANS.BUNDLE_PRO_2024;

    return [
        getShortStorageFeatureB2B(plan.MaxSpace),
        getNDomainsFeature({ n: plan.MaxDomains, tooltip: false }),
        getSecurePersonalAndSharedCalendarFeature(),
        getCloudStorageAndSharingFeature(),
        !isMailEssentials && getAdvancedAccountProtectionFeature(),
        !isMailEssentials && getManageUserPermissionsAndAccessFeature(),
        isPBS && getB2BVPNConnectionsPerUserFeature(),
        isPBS && getPasswordManagerToSecureCredentialsFeature(),
        getScribeFeature(),
    ].filter(isTruthy);
};

export const getPlanTitle = (plan: Plan | undefined) => {
    if (!plan) {
        return;
    }
    if (plan.Name === PLANS.VISIONARY) {
        return c('mail_signup_2023: Info').t`Become a Visionary and be part of ${BRAND_NAME}'s story`;
    }
};

export const getMailConfiguration = ({
    freePlan,
    plan,
    audience,
    isLargeViewport,
    plansMap,
    signupParameters: { mode, hideFreePlan, invite },
    signupParameters,
    canUseBYOE,
}: {
    freePlan: FreePlanDefault;
    audience: Audience.B2B | Audience.B2C;
    plan: Plan | undefined;
    signupParameters: SignupParameters2;
    isLargeViewport: boolean;
    vpnServersCountData: VPNServersCountData;
    planParameters: PlanParameters | undefined;
    plansMap?: PlansMap;
    canUseBYOE: boolean;
}): SignupConfiguration => {
    const logo = <MailLogo />;

    const title = c('mail_signup_2024: Info').t`An encrypted email service that puts your privacy first`;
    const b2bTitle = c('mail_signup_2024: Info').t`Encrypted solutions to protect your entire business`;
    const inviteTitle =
        invite?.type === 'porkbun' ? (
            <PorkbunHeader />
        ) : (
            <SignupHeaderV2 className="max-w-full">
                {c('mail_signup_2024: Info').t`You’ve been invited to try ${MAIL_APP_NAME}`}
            </SignupHeaderV2>
        );

    let features = getGenericFeatures(isLargeViewport, audience);
    if (invite?.type === 'porkbun') {
        features = [];
    }

    let planCards: SignupConfiguration['planCards'] = {
        [Audience.B2B]: [
            {
                plan: PLANS.MAIL_PRO,
                subsection: (
                    <FeatureListPlanCardSubSection
                        description={c('mail_signup_2024: Info').t`Encrypted email and calendar to get you started`}
                        features={
                            <PlanCardFeatureList
                                {...planCardFeatureProps}
                                features={getCustomMailFeatures(plansMap?.[PLANS.MAIL_PRO], freePlan)}
                            />
                        }
                    />
                ),
                type: 'standard' as const,
                guarantee: true,
            },
            {
                plan: PLANS.MAIL_BUSINESS,
                subsection: (
                    <FeatureListPlanCardSubSection
                        description={c('mail_signup_2024: Info').t`Enhanced security and premium features for teams`}
                        features={
                            <PlanCardFeatureList
                                {...planCardFeatureProps}
                                features={getCustomMailFeatures(plansMap?.[PLANS.MAIL_BUSINESS], freePlan)}
                            />
                        }
                    />
                ),
                type: 'standard' as const,
                guarantee: true,
            },
            {
                plan: PLANS.BUNDLE_PRO_2024,
                subsection: (
                    <FeatureListPlanCardSubSection
                        description={c('mail_signup_2024: Info')
                            .t`All ${BRAND_NAME} for Business apps and premium features to protect your entire business`}
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
                plan: PLANS.ENTERPRISE,
                subsection: <LetsTalkGenericSubSection app="mail" signupParameters={signupParameters} />,
                type: 'standard' as const,
                guarantee: true,
                interactive: false,
            },
        ],
        [Audience.B2C]: [
            !hideFreePlan && {
                plan: PLANS.FREE,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getFreeMailFeatures(freePlan)} />,
                type: 'standard' as const,
                guarantee: false,
            },
            {
                plan: PLANS.MAIL,
                subsection: (
                    <>
                        <AppsLogos className="mb-1 md:mb-3" apps={[APPS.PROTONMAIL, APPS.PROTONCALENDAR]} />
                        <PlanCardFeatureList
                            {...planCardFeatureProps}
                            features={getCustomMailFeatures(plansMap?.[PLANS.MAIL], freePlan)}
                            keyFeatures={getCustomMailPlusKeyFeatures(plansMap?.[PLANS.MAIL], freePlan)}
                        />
                    </>
                ),
                type: 'standard' as const,
                guarantee: true,
            },
            {
                plan: PLANS.BUNDLE,
                subsection: (
                    <>
                        <AppsLogos
                            className="mb-1 md:mb-3"
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
                        <PlanCardFeatureList
                            {...planCardFeatureProps}
                            features={getCustomMailFeatures(plansMap?.[PLANS.BUNDLE], freePlan)}
                            keyFeatures={getCustomBundleKeyFeatures(plansMap?.[PLANS.BUNDLE], freePlan)}
                        />
                    </>
                ),
                type: 'best' as const,
                guarantee: true,
            },
            {
                plan: PLANS.FAMILY,
                subsection: (
                    <>
                        <AppsLogos
                            className="mb-1 md:mb-3"
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
                        <PlanCardFeatureList
                            {...planCardFeatureProps}
                            features={getCustomMailFeatures(plansMap?.[PLANS.FAMILY], freePlan)}
                            keyFeatures={getCustomFamilyKeyFeatures(plansMap?.[PLANS.FAMILY], freePlan)}
                        />
                    </>
                ),
                type: 'standard' as const,
                guarantee: true,
            },
        ].filter(isTruthy),
    };

    if (mode === SignupMode.MailReferral) {
        planCards = {
            [Audience.B2C]: [
                {
                    plan: PLANS.FREE,
                    subsection: (
                        <PlanCardFeatureList {...planCardFeatureProps} features={getFreeMailFeatures(freePlan)} />
                    ),
                    type: 'standard' as const,
                    guarantee: false,
                },
                {
                    plan: PLANS.MAIL,
                    subsection: (
                        <PlanCardFeatureList
                            {...planCardFeatureProps}
                            features={getCustomMailFeatures(plansMap?.[PLANS.MAIL], freePlan)}
                        />
                    ),
                    type: 'best' as const,
                    guarantee: true,
                },
            ],
            [Audience.B2B]: [],
        };
    }

    if (invite?.type === 'porkbun') {
        audience = Audience.B2B;
        planCards = {
            [Audience.B2B]: [
                {
                    plan: PLANS.MAIL_PRO,
                    subsection: (
                        <FeatureListPlanCardSubSection
                            description={c('mail_signup_2024: Info').t`Encrypted email and calendar to get you started`}
                            features={
                                <PlanCardFeatureList
                                    {...planCardFeatureProps}
                                    features={getPorkbunFeatures(plansMap?.[PLANS.MAIL_PRO])}
                                    icon={true}
                                    tooltip={true}
                                />
                            }
                        />
                    ),
                    type: 'standard' as const,
                    guarantee: true,
                },
                {
                    plan: PLANS.MAIL_BUSINESS,
                    subsection: (
                        <FeatureListPlanCardSubSection
                            description={c('mail_signup_2024: Info')
                                .t`Enhanced security and premium features for teams`}
                            features={
                                <PlanCardFeatureList
                                    {...planCardFeatureProps}
                                    features={getPorkbunFeatures(plansMap?.[PLANS.MAIL_BUSINESS])}
                                    icon={true}
                                    tooltip={true}
                                />
                            }
                        />
                    ),
                    type: 'best' as const,
                    guarantee: true,
                },
                {
                    plan: PLANS.BUNDLE_PRO_2024,
                    subsection: (
                        <FeatureListPlanCardSubSection
                            description={c('mail_signup_2024: Info')
                                .t`All ${BRAND_NAME} for Business apps and premium features to protect your entire business`}
                            features={
                                <PlanCardFeatureList
                                    {...planCardFeatureProps}
                                    features={getPorkbunFeatures(plansMap?.[PLANS.BUNDLE_PRO_2024])}
                                    icon={true}
                                    tooltip={true}
                                />
                            }
                        />
                    ),
                    type: 'standard' as const,
                    guarantee: true,
                },
            ],
            [Audience.B2C]: [],
        };
    }

    const benefitItems = getMailBenefits(plan?.Name as PLANS, audience);
    const benefits = benefitItems && (
        <div>
            <div className="text-lg text-semibold">{getMailBenefitsTitle(plan?.Name as PLANS, audience)}</div>
            <Benefits className="mt-5 mb-5" features={benefitItems} />
            <div>{getJoinString()}</div>
        </div>
    );

    return {
        logo,
        audience,
        audiences: [
            {
                value: Audience.B2C,
                locationDescriptor: {
                    pathname: SSO_PATHS.MAIL_SIGNUP,
                    search: 'mode=sps',
                },
                title: c('mail_signup_2024: title').t`For individuals`,
                defaultPlan: PLANS.FREE,
            },
            {
                value: Audience.B2B,
                locationDescriptor: {
                    pathname: SSO_PATHS.MAIL_SIGNUP_B2B,
                    search: 'mode=sps',
                },
                title: c('mail_signup_2024: title').t`For businesses`,
                defaultPlan: PLANS.BUNDLE_PRO_2024,
            },
        ],
        title: {
            [SignupMode.Default]: <SignupHeaderV2>{audience === Audience.B2B ? b2bTitle : title}</SignupHeaderV2>,
            [SignupMode.Invite]: inviteTitle,
            [SignupMode.MailReferral]: <SignupHeaderV2>{title}</SignupHeaderV2>,
            [SignupMode.PassSimpleLogin]: <SignupHeaderV2>{title}</SignupHeaderV2>,
        }[mode],
        features,
        benefits,
        planCards,
        signupTypes: canUseBYOE ? [SignupType.Proton, SignupType.BringYourOwnEmail] : [SignupType.Proton],
        onboarding:
            invite?.type === 'porkbun'
                ? {
                      user: false,
                      // Porkbun has a special flow that redirects back to the signup page to enter the payment mode
                      // so we disable the onboarding steps and have them in the app instead
                      signup: false,
                  }
                : {
                      user: false,
                      signup: true,
                  },
        generateMnemonic: true,
        defaults: {
            plan: (() => {
                if (invite?.type === 'porkbun') {
                    return PLANS.MAIL_BUSINESS;
                }
                if (audience === Audience.B2B) {
                    return PLANS.BUNDLE_PRO_2024;
                }
                if (audience === Audience.B2C) {
                    return PLANS.BUNDLE;
                }
                return PLANS.FREE;
            })(),
            cycle: CYCLE.YEARLY,
        },
        product: APPS.PROTONMAIL,
        shortProductAppName: MAIL_SHORT_APP_NAME,
        productAppName: MAIL_APP_NAME,
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
