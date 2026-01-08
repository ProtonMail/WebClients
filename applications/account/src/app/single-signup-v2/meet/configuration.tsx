import { c } from 'ttag';

import MeetLogo from '@proton/components/components/logo/MeetLogo';
import { getNUsersText } from '@proton/components/containers/payments/features/highlights';
import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { getNDomainsFeatureText } from '@proton/components/containers/payments/features/mail';
import {
    FREE_MAX_ACTIVE_MEETINGS,
    FREE_MAX_PARTICIPANTS,
    PAID_MAX_ACTIVE_MEETINGS,
    PAID_MAX_PARTICIPANTS,
    getMaxMeetingsPerDayText,
    getMaxMeetingsText,
    getMaxParticipantsText,
    getMeetAppointmentSchedulingText,
    getMeetAppsText,
    getMeetBuiltInChatText,
    getMeetMeetingRecordingText,
    getMeetScreenSharingText,
    getMeetingMaxLengthText,
} from '@proton/components/containers/payments/features/meet';
import { VISIONARY_WALLETS, getWallets } from '@proton/components/containers/payments/features/wallet';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import type { Plan } from '@proton/payments';
import { CYCLE, PLANS, type PlansMap } from '@proton/payments';
import {
    APPS,
    BRAND_NAME,
    LUMO_SHORT_APP_NAME,
    MEET_APP_NAME,
    MEET_SHORT_APP_NAME,
    PROTON_SENTINEL_NAME,
    SSO_PATHS,
    VISIONARY_MAX_USERS,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Audience } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { SignupType } from '../../signup/interfaces';
import type { BenefitItem } from '../Benefits';
import Benefits from '../Benefits';
import { planCardFeatureProps } from '../PlanCardSelector';
import SignupHeaderV2 from '../SignupHeaderV2';
import { getBenefits, getBuiltInEncryptionBenefit, getGenericFeatures, getJoinString } from '../configuration/helper';
import type { SignupConfiguration } from '../interface';
import setupAccount from '../mail/account-setup.svg';
import CustomStep from './CustomStep';

const getNoLogsBenefit = (): BenefitItem => {
    return {
        key: `no-logs`,
        text: c('meet_2025: Info').t`Strict no-logs policy`,
        icon: {
            name: 'eye-slash',
        },
    };
};

const neverUsedForTrainingText = () => {
    return c('meet_2025: Info').t`Data never used for AI training`;
};

const getNoModelTrainingBenefit = (): BenefitItem => {
    return {
        key: `no-model-training`,
        text: neverUsedForTrainingText(),
        icon: {
            name: 'alias',
        },
    };
};

const getOpenSourceBenefit = (): BenefitItem => {
    return {
        key: 'open-source',
        text: c('meet_2025: Info').t`Open source`,
        icon: {
            name: 'magnifier',
        },
    };
};

const getMeetBenefits = (): BenefitItem[] => {
    return [getBuiltInEncryptionBenefit(), getNoLogsBenefit(), getNoModelTrainingBenefit(), getOpenSourceBenefit()];
};

const getStorageFeature = (bytes: number): PlanCardFeatureDefinition => {
    const size = humanSize({ bytes, fraction: 0, unitOptions: { max: 'TB' } });

    return {
        text: c('new_plans: feature').jt`${size} storage`,
        tooltip: c('wallet_signup_2024: Info').t`Encrypted email and file storage`,
        included: true,
    };
};

const getVpnFeature = () => {
    return {
        text: c('wallet_signup_2024: Info').t`Ultra fast and private VPN`,
        included: true,
    };
};

const getPasswordManagerFeature = () => {
    return {
        text: c('wallet_signup_2024: Info').t`Encrypted password manager`,
        included: true,
    };
};

const getSentinelFeature = () => {
    return {
        text: c('wallet_signup_2024: Info').t`Advanced account protection`,
        included: true,
        tooltip: c('wallet_signup_2024: Info').t`${PROTON_SENTINEL_NAME} program`,
    };
};

const getSecureCalendarFeature = (): PlanCardFeatureDefinition => {
    return {
        text: c('meet_2025: Info').t`Secure calendar`,
        included: true,
    };
};

const getCloudStorageAndFileSharingFeature = (): PlanCardFeatureDefinition => {
    return {
        text: c('meet_2025: Info').t`Cloud storage and file sharing`,
        included: true,
    };
};

const getDocumentAndSpreadsheetEditorFeature = (): PlanCardFeatureDefinition => {
    return {
        text: c('meet_2025: Info').t`Document & spreadsheet editor`,
        included: true,
    };
};

const getVpnWithAdBlockerFeature = (): PlanCardFeatureDefinition => {
    return {
        text: c('meet_2025: Info').t`VPN with ad-blocker and malware protection`,
        included: true,
    };
};

const getPasswordManagerWithTeamVaultsFeature = (): PlanCardFeatureDefinition => {
    return {
        text: c('meet_2025: Info').t`Password manager with team vaults`,
        included: true,
    };
};

const getVideoMeetingsWithParticipantsFeature = (): PlanCardFeatureDefinition => {
    return {
        text: c('meet_2025: Info').t`Video meetings, ${PAID_MAX_PARTICIPANTS} participants`,
        included: true,
    };
};

const getPrivateAIChatFeature = (): PlanCardFeatureDefinition => {
    return {
        text: c('meet_2025: Info').t`Private AI Chat (${LUMO_SHORT_APP_NAME})`,
        included: true,
    };
};

const getEmailWritingAssistantFeature = (): PlanCardFeatureDefinition => {
    return {
        text: c('meet_2025: Info').t`Email writing assistant`,
        included: true,
    };
};

const getDataRetentionPoliciesFeature = (): PlanCardFeatureDefinition => {
    return {
        text: c('meet_2025: Info').t`Data retention policies`,
        included: true,
    };
};

const getFreeMeetFeatures = () => {
    return [
        {
            text: getMeetingMaxLengthText('free'),
            included: true,
        },
        {
            text: getMaxParticipantsText(FREE_MAX_PARTICIPANTS),
            included: true,
        },
        {
            text: getMaxMeetingsText(FREE_MAX_ACTIVE_MEETINGS),
            included: true,
        },
        {
            text: getMeetAppsText(),
            included: true,
        },
        {
            text: getMeetScreenSharingText(),
            included: true,
        },
        {
            text: getMeetBuiltInChatText(),
            included: true,
        },
    ];
};

export const getVisionaryFeatures = ({ plan }: { plan: Plan | undefined }) => {
    if (!plan) {
        return [];
    }
    return [
        {
            text: c('meet_2025: Info').t`Everything in Meet Professional, plus:`,
            included: true,
        },
        {
            text: c('meet_2025: Info').t`100 ${BRAND_NAME} email addresses`,
            included: true,
        },
        {
            text: getNDomainsFeatureText(plan.MaxDomains),
            included: true,
        },
        getStorageFeature(plan.MaxSpace),
        getVpnFeature(),
        getPasswordManagerFeature(),
        getWallets(VISIONARY_WALLETS),
        {
            text: c('meet_2025: Info').t`Private and unlimited AI chat (${LUMO_SHORT_APP_NAME})`,
            included: true,
        },
        getSentinelFeature(),
        {
            text: getNUsersText(VISIONARY_MAX_USERS),
            included: true,
        },
    ];
};

const getMeetBusinessFeatures = () => {
    return [
        {
            text: getMeetingMaxLengthText('paid'),
            included: true,
        },
        {
            text: getMaxParticipantsText(FREE_MAX_PARTICIPANTS),
            included: true,
        },
        {
            text: getMaxMeetingsText(PAID_MAX_ACTIVE_MEETINGS),
            included: true,
        },
        {
            text: getMaxMeetingsPerDayText('unlimited'),
            included: true,
        },
        {
            text: getMeetAppsText(),
            included: true,
        },
        {
            text: getMeetScreenSharingText(),
            included: true,
        },
        {
            text: getMeetBuiltInChatText(),
            included: true,
        },
        {
            text: getMeetAppointmentSchedulingText(),
            included: true,
        },
        {
            text: getMeetMeetingRecordingText(),
            included: true,
        },
    ];
};

const getMeetBundleProFeatures = (plan?: Plan) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeature(plan.MaxSpace),
        {
            text: getNDomainsFeatureText(plan.MaxDomains),
            included: true,
        },
        getSecureCalendarFeature(),
        getCloudStorageAndFileSharingFeature(),
        getDocumentAndSpreadsheetEditorFeature(),
        getVpnWithAdBlockerFeature(),
        getPasswordManagerWithTeamVaultsFeature(),
    ];
};

const getMeetBundleBizFeatures = (plan?: Plan) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeature(plan.MaxSpace),
        {
            text: getNDomainsFeatureText(plan.MaxDomains),
            included: true,
        },
        getVideoMeetingsWithParticipantsFeature(),
        getPrivateAIChatFeature(),
        getEmailWritingAssistantFeature(),
        getDataRetentionPoliciesFeature(),
    ];
};

export const getMeetConfiguration = ({
    defaultPlan,
    plansMap,
    isLargeViewport,
    isMeetPlansEnabled,
    isNewB2BPlanEnabled,
}: {
    defaultPlan?: string;
    plansMap?: PlansMap;
    isLargeViewport: boolean;
    isMeetPlansEnabled: boolean;
    isNewB2BPlanEnabled: boolean;
}): SignupConfiguration => {
    const logo = <MeetLogo variant="wordmark-only" />;
    const appName = MEET_APP_NAME;

    const title = (
        <SignupHeaderV2>{c('meet_2025: Info').t`Private video calls for the conversations that matter`}</SignupHeaderV2>
    );

    const features = getGenericFeatures(isLargeViewport, Audience.B2B);
    const meetProPlan = plansMap?.[PLANS.MEET_BUSINESS];
    const bundleProPlan = plansMap?.[PLANS.BUNDLE_PRO_2024];
    const bundleBizPlan = plansMap?.[PLANS.BUNDLE_BIZ_2025];

    const CustomizeFeatureSubSection = ({
        title,
        features,
    }: {
        title?: string;
        features: PlanCardFeatureDefinition[];
    }) => (
        <div>
            <div className={clsx(planCardFeatureProps.className, planCardFeatureProps.itemClassName, 'text-left')}>
                {c('meet_2025: Info').t`Everything from ${title}, plus...`}
            </div>
            <PlanCardFeatureList {...planCardFeatureProps} features={features} />
        </div>
    );
    const planCards: SignupConfiguration['planCards'] = {
        [Audience.B2B]: [
            isMeetPlansEnabled && {
                plan: PLANS.MEET_BUSINESS,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getMeetBusinessFeatures()} />, // TODO: Check features
                type: 'standard' as const,
                guarantee: true,
            },
            {
                plan: PLANS.BUNDLE_PRO_2024,
                subsection: (
                    <CustomizeFeatureSubSection
                        title={meetProPlan?.Title}
                        features={getMeetBundleProFeatures(bundleProPlan)}
                    />
                ),
                type: 'best' as const,
                guarantee: true,
                defaultPlan: PLANS.BUNDLE_PRO_2024,
            },
            isNewB2BPlanEnabled && {
                plan: PLANS.BUNDLE_BIZ_2025,
                subsection: (
                    <CustomizeFeatureSubSection
                        title={bundleProPlan?.Title}
                        features={getMeetBundleBizFeatures(bundleBizPlan)}
                    />
                ),
                type: 'standard' as const,
                guarantee: true,
            },
        ].filter(isTruthy),
        [Audience.B2C]: [
            {
                plan: PLANS.FREE,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getFreeMeetFeatures()} />,
                type: 'standard' as const,
                guarantee: false,
            },
        ].filter(isTruthy),
    };

    const benefits = (() => {
        const benefitItems = getMeetBenefits();

        return (
            benefitItems && (
                <div>
                    <div className="text-lg text-semibold">{getBenefits(appName)}</div>
                    <Benefits className="mt-5 mb-5" features={benefitItems} />
                    <div>{getJoinString(Audience.B2B)}</div>
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
        audience: Audience.B2B,
        audiences: [
            {
                value: Audience.B2B,
                locationDescriptor: {
                    pathname: SSO_PATHS.MEET_SIGNUP_B2B,
                },
                title: c('meet_signup_2025: title').t`For businesses`,
                defaultPlan: PLANS.BUNDLE_PRO_2024,
            },
        ].filter(isTruthy),
        signupTypes: [SignupType.External, SignupType.Proton],
        generateMnemonic: true,
        defaults: (() => {
            const plans = planCards[Audience.B2B].map((it) => it.plan).filter(isTruthy);

            if (defaultPlan && plans.includes(defaultPlan as PLANS)) {
                return {
                    plan: defaultPlan as PLANS,
                    cycle: CYCLE.YEARLY,
                };
            }

            return {
                plan: PLANS.BUNDLE_PRO_2024,
                cycle: CYCLE.YEARLY,
            };
        })(),
        onboarding: {
            user: false,
            signup: true,
        },
        product: APPS.PROTONMEET,
        shortProductAppName: MEET_SHORT_APP_NAME,
        productAppName: MEET_APP_NAME,
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
