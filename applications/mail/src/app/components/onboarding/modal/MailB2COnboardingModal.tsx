import { useEffect, useState } from 'react';

import { useWelcomeFlags } from '@proton/account';
import { OnboardingModal, useEventManager } from '@proton/components';
import type { OnboardingStepComponent } from '@proton/components/containers/onboarding/interface';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import isTruthy from '@proton/utils/isTruthy';

import GetMobileAppStep, {
    isGetMobileAppStepEligible,
} from 'proton-mail/components/onboarding/modal/steps/GetMobileAppStep';
import { useMailDispatch } from 'proton-mail/store/hooks';

import { useMailOnboardingTelemetry } from '../useMailOnboardingTelemetry';
import type { OnboardingStepEligibleCallback } from './interface';
import ActivatePremiumFeaturesStep, {
    isActivatePremiumFeaturesStepEligible,
} from './steps/ActivatePremiumFeaturesStep';
import DisplayNameStep, { isDisplayNameStepEligible } from './steps/DisplayNameStep';
import GetDesktopAppStep, { isGetDesktopAppStepEligible } from './steps/GetDesktopAppStep';
import NewOnboardingOrganizationStep, {
    isNewOnboardingOrganizationStepEligible,
} from './steps/NewOnboardingOrganizationStep';
import NewOnboardingThemes, { isNewOnboardingThemesStepEligible } from './steps/NewOnboardingThemes';
import OnboardingWelcomeStep, { isOnboardingWelcomeStepEligible } from './steps/OnboardingWelcomeStep';
import PartnerStep, { isPartnerStepEligible } from './steps/PartnerStep';

export interface MailOnboardingProps {
    hideDiscoverApps?: boolean;
    showGenericSteps?: boolean;
    onClose?: () => void;
    onDone?: () => void;
    onExit?: () => void;
    open?: boolean;
}

type StepId =
    | 'onboarding-welcome'
    | 'new-onboarding-themes'
    | 'new-onboarding-organization'
    | 'get-mobile-app'
    | 'get-desktop-app'
    | 'activate-premium-features'
    | 'partner'
    | 'display-name';

const STEPS: Record<
    StepId,
    {
        eligible: OnboardingStepEligibleCallback;
        component: OnboardingStepComponent;
    }
> = {
    'onboarding-welcome': {
        eligible: isOnboardingWelcomeStepEligible,
        component: OnboardingWelcomeStep,
    },
    'new-onboarding-themes': {
        eligible: isNewOnboardingThemesStepEligible,
        component: NewOnboardingThemes,
    },
    'new-onboarding-organization': {
        eligible: isNewOnboardingOrganizationStepEligible,
        component: NewOnboardingOrganizationStep,
    },
    'get-mobile-app': {
        eligible: isGetMobileAppStepEligible,
        component: GetMobileAppStep,
    },
    'get-desktop-app': {
        eligible: isGetDesktopAppStepEligible,
        component: GetDesktopAppStep,
    },
    'activate-premium-features': {
        eligible: isActivatePremiumFeaturesStepEligible,
        component: ActivatePremiumFeaturesStep,
    },
    partner: {
        eligible: isPartnerStepEligible,
        component: PartnerStep,
    },
    'display-name': {
        eligible: isDisplayNameStepEligible,
        component: DisplayNameStep,
    },
};

const MailB2COnboardingModal = (props: MailOnboardingProps) => {
    const { call } = useEventManager();
    const { endReplay } = useWelcomeFlags();
    const dispatch = useMailDispatch();
    const sendMailOnboardingTelemetry = useMailOnboardingTelemetry();
    const [loading, setLoading] = useState(true);
    const [imgsToPreload, setImgsToPreload] = useState<string[]>([]);
    const [steps, setSteps] = useState<Set<StepId>>(new Set());

    const getStepComponent = (id: StepId) => {
        const step = steps.has(id);
        return step ? STEPS[id].component : undefined;
    };

    const handleDone = () => {
        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.finish_onboarding_modals, {});
        props.onDone?.();
    };

    useEffect(() => {
        // Send telemetry onboarding start event
        void sendMailOnboardingTelemetry(TelemetryMailOnboardingEvents.start_onboarding_modals, {});

        const init = async () => {
            const toPreload = new Set<string>();
            const stepsToDisplay = new Set<StepId>();

            // Get eligible steps
            await Promise.all(
                Object.entries(STEPS).map<void>(async ([id, step]) => {
                    const { canDisplay, preload } = await step.eligible(dispatch);

                    if (canDisplay) {
                        stepsToDisplay.add(id as StepId);
                    }

                    if (canDisplay && preload) {
                        preload.forEach((img) => toPreload.add(img));
                    }
                })
            );

            setImgsToPreload(Array.from(toPreload));
            setSteps(stepsToDisplay);
            setLoading(false);
        };

        void init();
    }, []);

    if (loading || !steps) {
        return null;
    }

    return (
        <>
            <OnboardingModal
                {...props}
                onClose={() => {
                    // Call the event manager when closing the modal so that BYOE users get as much imported emails as possible
                    void call();
                    endReplay();
                    props.onClose?.();
                }}
                onDone={handleDone}
                modalContentClassname="mx-12 pt-12 pb-6"
                modalClassname="onboarding-modal--larger onboarding-modal--new"
                showGenericSteps={false}
                extraProductStep={getStepComponent('activate-premium-features')}
                stepDotClassName="mt-4"
                data-testid="new-onboarding-variant"
                genericSteps={{
                    setupThemeStep: getStepComponent('new-onboarding-themes'),
                    organizationStep: getStepComponent('new-onboarding-organization'),
                }}
            >
                {[
                    getStepComponent('display-name'),
                    getStepComponent('partner'),
                    getStepComponent('onboarding-welcome'),
                    getStepComponent('get-desktop-app'),
                    getStepComponent('get-mobile-app'),
                ].filter(isTruthy)}
            </OnboardingModal>
            {imgsToPreload.map((imgUrl) => (
                <link key={imgUrl} rel="prefetch" href={imgUrl} as="image" />
            ))}
        </>
    );
};

export default MailB2COnboardingModal;
