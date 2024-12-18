import { useEffect } from 'react';

import { useWelcomeFlags } from '@proton/account';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { OnboardingModal } from '@proton/components/index';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import {
    getIsB2BAudienceFromPlan,
    getIsB2BAudienceFromSubscription,
    isTrial,
} from '@proton/shared/lib/helpers/subscription';
import isTruthy from '@proton/utils/isTruthy';

import GetMobileAppStep from 'proton-mail/components/onboarding/modal/steps/GetMobileAppStep';

import { useMailOnboardingTelemetry } from '../useMailOnboardingTelemetry';
import ActivatePremiumFeaturesStep from './steps/ActivatePremiumFeaturesStep';
import GetDesktopAppStep from './steps/GetDesktopAppStep';
import NewOnboardingOrganizationStep from './steps/NewOnboardingOrganizationStep';
import NewOnboardingThemes from './steps/NewOnboardingThemes';
import OnboardingWelcomeStep from './steps/OnboardingWelcomeStep';

export interface MailOnboardingProps {
    hideDiscoverApps?: boolean;
    showGenericSteps?: boolean;
    onClose?: () => void;
    onDone?: () => void;
    onExit?: () => void;
    open?: boolean;
}

const useUserInfos = (): Record<'isB2B' | 'isLoading' | 'isMailPaidPlan', boolean> => {
    const [user, loadingUser] = useUser();
    const [subscription, loadingSub] = useSubscription();
    const [organization, loadingOrg] = useOrganization();

    let isB2B = false;
    const isLoading = loadingUser || loadingSub || loadingOrg;
    const isUserWithB2BPlan = !user.isSubUser && getIsB2BAudienceFromSubscription(subscription);
    const isSubUserWithB2BPlan = user.isSubUser && organization && getIsB2BAudienceFromPlan(organization.PlanName);

    if (isUserWithB2BPlan || isSubUserWithB2BPlan) {
        isB2B = true;
    }

    const isMailPaidPlan = user.isPaid && (isTrial(subscription) || user.hasPaidMail);

    return { isB2B, isLoading, isMailPaidPlan };
};

const MailOnboardingModal = (props: MailOnboardingProps) => {
    const { endReplay } = useWelcomeFlags();
    const [sendMailOnboardingTelemetry, loadingTelemetryDeps] = useMailOnboardingTelemetry();
    const { isLoading, isB2B, isMailPaidPlan } = useUserInfos();
    const displayPremiumFeaturesSteps = isMailPaidPlan && !isB2B;
    const displayGetDesktopAppStep = !isMobile() && !isElectronApp;

    const handleDone = () => {
        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.finish_onboarding_modals, {});
        props.onDone?.();
    };

    // Specific for Telemetry
    useEffect(() => {
        if (loadingTelemetryDeps) {
            return;
        }

        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.start_onboarding_modals, {});
    }, [loadingTelemetryDeps]);

    if (isLoading) {
        return null;
    }

    return (
        <OnboardingModal
            {...props}
            onClose={endReplay}
            onDone={handleDone}
            modalContentClassname="mx-12 mt-12 mb-6"
            modalClassname="onboarding-modal--larger onboarding-modal--new"
            showGenericSteps={false}
            extraProductStep={displayPremiumFeaturesSteps ? [ActivatePremiumFeaturesStep] : undefined}
            stepDotClassName="mt-4"
            data-testid="new-onboarding-variant"
            genericSteps={{
                setupThemeStep: NewOnboardingThemes,
                organizationStep: NewOnboardingOrganizationStep,
            }}
        >
            {[OnboardingWelcomeStep, displayGetDesktopAppStep && GetDesktopAppStep, GetMobileAppStep].filter(isTruthy)}
        </OnboardingModal>
    );
};

export default MailOnboardingModal;
