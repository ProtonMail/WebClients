import { c } from 'ttag';

import { DriveLogo } from '@proton/components/components';
import { getNCalendarsFeature } from '@proton/components/containers/payments/features/calendar';
import { getStorageFeature } from '@proton/components/containers/payments/features/drive';
import { getSupport } from '@proton/components/containers/payments/features/highlights';
import { getNAddressesFeature } from '@proton/components/containers/payments/features/mail';
import { getVPNConnections } from '@proton/components/containers/payments/features/vpn';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { MAX_CALENDARS_FREE } from '@proton/shared/lib/calendar/constants';
import { APPS, CYCLE, DRIVE_APP_NAME, DRIVE_SHORT_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import { Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { SignupType } from '../../signup/interfaces';
import Benefits, { BenefitItem } from '../Benefits';
import BundlePlanSubSection from '../BundlePlanSubSection';
import { PlanCard, planCardFeatureProps } from '../PlanCardSelector';
import { getBenefits, getGenericBenefits, getGenericFeatures, getJoinString } from '../configuration/helper';
import { SignupConfiguration } from '../interface';
import CustomStep from '../mail/CustomStep';
import setupAccount from '../mail/account-setup.svg';

export const getDriveBenefits = (): BenefitItem[] => {
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

export const getFreeDriveFeatures = () => {
    return [getStorageFeature(-1)];
};

export const getCustomDriveFeatures = (plan: Plan | undefined) => {
    if (!plan) {
        return [];
    }
    return [
        getStorageFeature(plan.MaxSpace, { boldStorageSize: false }),
        getNAddressesFeature({ n: plan.MaxAddresses || 1 }),
        getNCalendarsFeature(plan.MaxCalendars || MAX_CALENDARS_FREE),
        getVPNConnections(1),
        getSupport('priority'),
    ];
};

export const getDriveConfiguration = ({
    isLargeViewport,
    plansMap,
    vpnServersCountData,
    hideFreePlan,
}: {
    hideFreePlan: boolean;
    plansMap?: PlansMap;
    isLargeViewport: boolean;
    vpnServersCountData: VPNServersCountData;
}): SignupConfiguration => {
    const logo = <DriveLogo />;

    const title = <>{c('drive_signup_2023: Info').t`Secure cloud storage and file sharing that protects your data`}</>;

    const features = getGenericFeatures(isLargeViewport);

    const planCards: PlanCard[] = [
        !hideFreePlan && {
            plan: PLANS.FREE,
            subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getFreeDriveFeatures()} />,
            type: 'standard' as const,
            guarantee: false,
        },
        {
            plan: PLANS.DRIVE,
            subsection: (
                <PlanCardFeatureList
                    {...planCardFeatureProps}
                    features={getCustomDriveFeatures(plansMap?.[PLANS.DRIVE])}
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

    const benefitItems = getDriveBenefits();
    const benefits = benefitItems && (
        <div>
            <div className="text-lg text-semibold">{getBenefits(DRIVE_APP_NAME)}</div>
            <Benefits className="mt-5 mb-5" features={benefitItems} />
            <div>{getJoinString()}</div>
        </div>
    );

    return {
        logo,
        title,
        features,
        benefits,
        planCards,
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
    };
};
