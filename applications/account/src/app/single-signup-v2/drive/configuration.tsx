import { c } from 'ttag';

import { DriveLogo } from '@proton/components/components';
import { getNCalendarsFeature } from '@proton/components/containers/payments/features/calendar';
import { getFreeDriveStorageFeature, getStorageFeature } from '@proton/components/containers/payments/features/drive';
import { getSupport } from '@proton/components/containers/payments/features/highlights';
import { getNAddressesFeature } from '@proton/components/containers/payments/features/mail';
import { getVPNConnections } from '@proton/components/containers/payments/features/vpn';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { MAX_CALENDARS_FREE } from '@proton/shared/lib/calendar/constants';
import { APPS, CYCLE, DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Audience, FreePlanDefault, Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { SignupType } from '../../signup/interfaces';
import Benefits, { BenefitItem } from '../Benefits';
import BundlePlanSubSection from '../BundlePlanSubSection';
import { PlanCard, planCardFeatureProps } from '../PlanCardSelector';
import { getBenefits, getGenericBenefits, getGenericFeatures, getJoinString } from '../configuration/helper';
import { SignupConfiguration, SignupMode } from '../interface';
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

export const getFreeDriveFeatures = ({ freePlan }: { freePlan: FreePlanDefault }) => {
    return [getFreeDriveStorageFeature(freePlan)];
};

export const getCustomDriveFeatures = ({ plan, freePlan }: { plan: Plan | undefined; freePlan: FreePlanDefault }) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeature(plan.MaxSpace, { boldStorageSize: false, freePlan }),
        getNAddressesFeature({ n: plan.MaxAddresses || 1 }),
        getNCalendarsFeature(plan.MaxCalendars || MAX_CALENDARS_FREE),
        getVPNConnections(1),
        getSupport('priority'),
    ];
};

export const getDriveConfiguration = ({
    isLargeViewport,
    plansMap,
    mode,
    vpnServersCountData,
    hideFreePlan,
    freePlan,
    audience,
}: {
    hideFreePlan: boolean;
    audience: Audience.B2B | Audience.B2C;
    plansMap?: PlansMap;
    mode: SignupMode;
    isLargeViewport: boolean;
    vpnServersCountData: VPNServersCountData;
    freePlan: FreePlanDefault;
}): SignupConfiguration => {
    const logo = <DriveLogo />;

    const title =
        mode === SignupMode.Invite ? (
            <>{c('drive_signup_2023: Title').t`You're invited to access a file in ${DRIVE_APP_NAME}`}</>
        ) : (
            <>{c('drive_signup_2023: Title').t`Secure cloud storage and file sharing that protects your data`}</>
        );

    const features = getGenericFeatures(isLargeViewport);

    const planCards: PlanCard[] = [
        !hideFreePlan && {
            plan: PLANS.FREE,
            subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getFreeDriveFeatures({ freePlan })} />,
            type: 'standard' as const,
            guarantee: false,
        },
        {
            plan: PLANS.DRIVE,
            subsection: (
                <PlanCardFeatureList
                    {...planCardFeatureProps}
                    features={getCustomDriveFeatures({ plan: plansMap?.[PLANS.DRIVE], freePlan })}
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

    const benefitItems = getDriveBenefits({ mode, freePlan });
    const benefits = benefitItems && (
        <div>
            <div className="text-lg text-semibold">
                {mode === SignupMode.Invite
                    ? c('drive_signup_2023: Title').t`Free, encrypted, and secure cloud storage`
                    : getBenefits(DRIVE_APP_NAME)}
            </div>
            <Benefits className="mt-5 mb-5" features={benefitItems} />
            <div>{getJoinString()}</div>
        </div>
    );

    return {
        logo,
        title,
        audience,
        features,
        benefits,
        planCards: { [Audience.B2C]: planCards, [Audience.B2B]: [] },
        signupTypes: [SignupType.Email, SignupType.Username],
        generateMnemonic: false,
        onboarding: {
            user: false,
            signup: true,
        },
        defaults: {
            plan: PLANS.DRIVE,
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
