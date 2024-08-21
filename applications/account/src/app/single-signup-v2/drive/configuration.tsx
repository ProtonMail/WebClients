import { c } from 'ttag';

import { DriveLogo } from '@proton/components/components';
import { getNCalendarsFeature } from '@proton/components/containers/payments/features/calendar';
import {
    getDocumentEditor,
    getEndToEndEncryption,
    getFreeDriveStorageFeature,
    getPremiumFeatures,
    getStorageFeature,
    getStorageFeatureB2B,
    getVersionHistory,
} from '@proton/components/containers/payments/features/drive';
import { getSupport } from '@proton/components/containers/payments/features/highlights';
import { getCustomSecureMailB2B, getNAddressesFeature } from '@proton/components/containers/payments/features/mail';
import { getPasswordManager } from '@proton/components/containers/payments/features/pass';
import { getUpToNUsers } from '@proton/components/containers/payments/features/plan';
import {
    getB2BHighSpeedVPNConnectionsFeature,
    getVPNConnections,
} from '@proton/components/containers/payments/features/vpn';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { MAX_CALENDARS_FREE } from '@proton/shared/lib/calendar/constants';
import {
    APPS,
    BRAND_NAME,
    CYCLE,
    DRIVE_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    PLANS,
    SSO_PATHS,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { FreePlanDefault, Plan, PlansMap } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { SignupType } from '../../signup/interfaces';
import type { BenefitItem } from '../Benefits';
import Benefits from '../Benefits';
import FeatureListPlanCardSubSection from '../FeatureListPlanCardSubSection';
import LetsTalkGenericSubSection from '../LetsTalkGenericSubsection';
import { planCardFeatureProps } from '../PlanCardSelector';
import { getBenefits, getGenericBenefits, getGenericFeatures, getJoinString } from '../configuration/helper';
import type { SignupConfiguration } from '../interface';
import { SignupMode } from '../interface';
import CustomStep from '../mail/CustomStep';
import setupAccount from '../mail/account-setup.svg';

export const getDriveBenefits = ({
    mode,
    freePlan,
}: {
    mode: SignupMode;
    freePlan: FreePlanDefault;
}): BenefitItem[] => {
    if (mode === SignupMode.Invite) {
        const totalStorageSize = humanSize({ bytes: freePlan.MaxDriveRewardSpace, fraction: 0 });

        return [
            {
                key: 1,
                text: c('drive_signup_2023: Info').t`Protected by Swiss privacy laws`,
                icon: {
                    name: 'shield',
                },
            },
            {
                key: 2,
                text: c('drive_signup_2023: Feature').t`End-to-end encrypted`,
                icon: {
                    name: 'lock',
                },
            },
            {
                key: 3,
                text: c('drive_signup_2023: Feature').t`${totalStorageSize} of storage for free`,
                icon: {
                    name: 'storage',
                },
            },
        ];
    }

    return [
        {
            key: 1,
            text: c('drive_signup_2023: Info').t`Encrypted cloud storage for all your files`,
            icon: {
                name: 'lock',
            },
        },
        {
            key: 2,
            text: c('drive_signup_2023: Info').t`Advanced sharing security`,
            icon: {
                name: 'arrow-up-from-square',
            },
        },
        ...getGenericBenefits(),
    ];
};

export const getDriveB2BBenefits = ({
    mode,
    freePlan,
}: {
    mode: SignupMode;
    freePlan: FreePlanDefault;
}): BenefitItem[] => {
    if (mode === SignupMode.Invite) {
        const totalStorageSize = humanSize({ bytes: freePlan.MaxDriveRewardSpace, fraction: 0 });

        return [
            {
                key: 1,
                text: c('drive_signup_2023: Info').t`Protected by Swiss privacy laws`,
                icon: {
                    name: 'shield',
                },
            },
            {
                key: 2,
                text: c('drive_signup_2023: Feature').t`End-to-end encrypted`,
                icon: {
                    name: 'lock',
                },
            },
            {
                key: 3,
                text: c('drive_signup_2023: Feature').t`${totalStorageSize} of storage for free`,
                icon: {
                    name: 'storage',
                },
            },
        ];
    }

    return [
        {
            key: 1,
            text: getBoldFormattedText(c('drive_signup_2024: Info').t`**Secure:** end-to-end encryption`),
            icon: {
                name: 'lock',
            },
        },
        {
            key: 2,
            text: getBoldFormattedText(c('drive_signup_2024: Info').t`**Collaborative:** online document editor`),
            icon: {
                name: 'users',
            },
        },
        {
            key: 3,
            text: getBoldFormattedText(
                c('drive_signup_2024: Info').t`**Simple and user-friendly:** import your files and setup in minutes`
            ),
            icon: {
                name: 'cloud',
            },
        },
        {
            key: 4,
            text: getBoldFormattedText(c('drive_signup_2024: Info').t`**GDPR** and **HIPAA** compliant`),
            icon: {
                name: 'shield',
            },
        },
        {
            key: 5,
            text: getBoldFormattedText(c('drive_signup_2024: Info').t`**ISO 27001** certified`),
            icon: {
                name: 'globe',
            },
        },
    ];
};

export const getFreeDriveFeatures = ({ freePlan }: { freePlan: FreePlanDefault }) => {
    return [getFreeDriveStorageFeature(freePlan), getDocumentEditor()];
};

export const getCustomDriveFeatures = ({ plan, freePlan }: { plan: Plan | undefined; freePlan: FreePlanDefault }) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeature(plan.MaxSpace, {
            freePlan,
            family: plan.Name === PLANS.FAMILY,
        }),
        getEndToEndEncryption(),
        getNAddressesFeature({ n: plan.MaxAddresses || 1 }),
        getNCalendarsFeature(plan.MaxCalendars || MAX_CALENDARS_FREE),
        getVPNConnections(1),
        getSupport('priority'),
    ];
};

export const getDrivePlusFeatures = ({ plan, freePlan }: { plan: Plan | undefined; freePlan: FreePlanDefault }) => {
    if (!plan) {
        return [];
    }
    return [getStorageFeature(plan.MaxSpace, { freePlan }), getDocumentEditor(), getVersionHistory()];
};

export const getBundleFeatures = ({ plan, freePlan }: { plan: Plan | undefined; freePlan: FreePlanDefault }) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeature(plan.MaxSpace, { freePlan }),
        getDocumentEditor(),
        getVersionHistory(),
        getPremiumFeatures(),
    ];
};

export const getFamilyFeatures = ({ plan, freePlan }: { plan: Plan | undefined; freePlan: FreePlanDefault }) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeature(plan.MaxSpace, { freePlan, family: true }),
        getUpToNUsers(6),
        getDocumentEditor(),
        getVersionHistory(),
        getPremiumFeatures(),
    ];
};

export const getDriveBusinessFeatures = ({ plan }: { plan: Plan | undefined; freePlan: FreePlanDefault }) => {
    if (!plan) {
        return [];
    }
    return [getStorageFeatureB2B(plan.MaxSpace, { subtext: false }), getVersionHistory(365)];
};

export const getBundleProFeatures = ({ plan }: { plan: Plan | undefined; freePlan: FreePlanDefault }) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeatureB2B(plan.MaxSpace, { subtext: false }),
        getVersionHistory('10y'),
        getCustomSecureMailB2B(),
        getB2BHighSpeedVPNConnectionsFeature(),
        getPasswordManager(),
    ];
};

export const getDriveConfiguration = ({
    isLargeViewport,
    plansMap,
    mode,
    hideFreePlan,
    freePlan,
    audience,
    canAccessDriveBizPlan,
}: {
    hideFreePlan: boolean;
    audience: Audience.B2B | Audience.B2C;
    plansMap?: PlansMap;
    mode: SignupMode;
    isLargeViewport: boolean;
    freePlan: FreePlanDefault;
    canAccessDriveBizPlan?: boolean;
}): SignupConfiguration => {
    const logo = <DriveLogo />;
    const title = c('drive_signup_2024: Info').t`Secure cloud storage that gives you control of your data`;
    const b2bTitle = c('drive_signup_2024: Info').t`Protect sensitive business information and collaborate securely`;
    const inviteTitle = c('drive_signup_2023: Title').t`You're invited to access a file in ${DRIVE_APP_NAME}`;
    const onboardingTitle = title;

    const features = getGenericFeatures(isLargeViewport, audience);

    let planCards: SignupConfiguration['planCards'] = {
        [Audience.B2B]: [
            {
                plan: PLANS.DRIVE_BUSINESS,
                subsection: (
                    <FeatureListPlanCardSubSection
                        description={c('drive_signup_2024: Info')
                            .t`Advanced protection that goes beyond industry standards`}
                        features={
                            <PlanCardFeatureList
                                {...planCardFeatureProps}
                                features={getDriveBusinessFeatures({
                                    plan: plansMap?.[PLANS.DRIVE_BUSINESS],
                                    freePlan,
                                })}
                            />
                        }
                    />
                ),
                type: 'best' as const,
                guarantee: false,
            },
            {
                plan: PLANS.BUNDLE_PRO_2024,
                subsection: (
                    <FeatureListPlanCardSubSection
                        description={c('mail_signup_2024: Info')
                            .t`All ${BRAND_NAME} business apps and premium features to protect your entire business`}
                        features={
                            <PlanCardFeatureList
                                {...planCardFeatureProps}
                                features={getBundleProFeatures({ plan: plansMap?.[PLANS.BUNDLE_PRO_2024], freePlan })}
                            />
                        }
                    />
                ),
                type: 'standard' as const,
                guarantee: true,
            },
            {
                plan: PLANS.ENTERPRISE,
                subsection: <LetsTalkGenericSubSection app="drive" />,
                type: 'standard' as const,
                guarantee: true,
                interactive: false,
            },
        ],
        [Audience.B2C]: [
            !hideFreePlan && {
                plan: PLANS.FREE,
                subsection: (
                    <PlanCardFeatureList {...planCardFeatureProps} features={getFreeDriveFeatures({ freePlan })} />
                ),
                type: 'standard' as const,
                guarantee: false,
            },
            {
                plan: PLANS.DRIVE,
                subsection: (
                    <PlanCardFeatureList
                        {...planCardFeatureProps}
                        features={getDrivePlusFeatures({ plan: plansMap?.[PLANS.DRIVE], freePlan })}
                    />
                ),
                type: 'standard' as const,
                guarantee: true,
            },
            {
                plan: PLANS.BUNDLE,
                subsection: (
                    <PlanCardFeatureList
                        {...planCardFeatureProps}
                        features={getBundleFeatures({ plan: plansMap?.[PLANS.BUNDLE], freePlan })}
                    />
                ),
                type: 'best' as const,
                guarantee: true,
            },
            {
                plan: PLANS.FAMILY,
                subsection: (
                    <PlanCardFeatureList
                        {...planCardFeatureProps}
                        features={getFamilyFeatures({ plan: plansMap?.[PLANS.FAMILY], freePlan })}
                    />
                ),
                type: 'standard' as const,
                guarantee: true,
            },
        ].filter(isTruthy),
    };

    const benefitItems = getDriveBenefits({ mode, freePlan });
    const benefitB2BItems = getDriveB2BBenefits({ mode, freePlan });
    const benefitsTitle = getBenefits(DRIVE_APP_NAME);
    const benefitsB2BTitle = c('drive_signup_2024: TitleB2B').t`The only business solution that is:`;
    const benefitsOnboardingTitle = benefitsTitle;
    const benefitsInviteTitle = c('drive_signup_2023: Title').t`Free, encrypted, and secure cloud storage`;
    const benefits = benefitItems && (
        <div>
            <div className="text-lg text-semibold">
                {
                    {
                        [SignupMode.Default]: audience === Audience.B2B ? benefitsB2BTitle : benefitsTitle,
                        [SignupMode.Onboarding]: benefitsOnboardingTitle,
                        [SignupMode.Invite]: benefitsInviteTitle,
                        [SignupMode.MailReferral]: benefitsTitle,
                    }[mode]
                }
            </div>
            <Benefits className="mt-5 mb-5" features={audience === Audience.B2B ? benefitB2BItems : benefitItems} />
            <div>{getJoinString(audience)}</div>
        </div>
    );

    return {
        logo,
        title: {
            [SignupMode.Default]: audience === Audience.B2B ? b2bTitle : title,
            [SignupMode.Onboarding]: onboardingTitle,
            [SignupMode.Invite]: inviteTitle,
            [SignupMode.MailReferral]: title,
        }[mode],
        audience,
        audiences: [
            {
                value: Audience.B2C,
                locationDescriptor: {
                    pathname: SSO_PATHS.DRIVE_SIGNUP,
                },
                title: c('mail_signup_2024: title').t`For individuals`,
                defaultPlan: PLANS.BUNDLE,
            },
            canAccessDriveBizPlan && {
                value: Audience.B2B,
                locationDescriptor: {
                    pathname: SSO_PATHS.DRIVE_SIGNUP_B2B,
                },
                title: c('mail_signup_2024: title').t`For businesses`,
                defaultPlan: PLANS.DRIVE_BUSINESS,
            },
        ].filter(isTruthy),
        features,
        benefits,
        planCards,
        signupTypes: [SignupType.Email, SignupType.Username],
        generateMnemonic: true,
        onboarding: {
            user: false,
            signup: true,
        },
        defaults: {
            plan: (() => {
                if (audience === Audience.B2B) {
                    return PLANS.DRIVE_BUSINESS;
                }
                return PLANS.BUNDLE;
            })(),
            cycle: CYCLE.YEARLY,
        },
        product: APPS.PROTONDRIVE,
        shortProductAppName: DRIVE_SHORT_APP_NAME,
        productAppName: DRIVE_APP_NAME,
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
