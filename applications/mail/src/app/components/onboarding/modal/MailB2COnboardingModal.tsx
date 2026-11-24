import { useEffect, useState } from 'react';

import { useFlagsStatus } from '@unleash/proxy-client-react';

import { organizationThunk } from '@proton/account/organization';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import OnboardingModal from '@proton/components/containers/onboarding/OnboardingModal';
import type { OnboardingStepComponent } from '@proton/components/containers/onboarding/interface';
import useEventManager from '@proton/components/hooks/useEventManager';
import { useVariant } from '@proton/unleash/useVariant';
import isTruthy from '@proton/utils/isTruthy';

import { useMailDispatch } from '../../../store/hooks';
import { useOnboardingTracking } from '../../../telemetry/onboardingEvents';
import type { OnboardingStepEligibleCallback } from './interface';
import { isRegularB2COnboarding } from './isRegularB2COnboarding';
import ActivatePremiumFeaturesStep, {
    isActivatePremiumFeaturesStepEligible,
} from './steps/ActivatePremiumFeaturesStep';
import ChooseViewLayoutStep, { isChooseViewLayoutStepEligible } from './steps/ChooseViewLayoutStep';
import { DiscoverAppsStep } from './steps/DiscoverAppsStep';
import DisplayNameStep, { isDisplayNameStepEligible } from './steps/DisplayNameStep';
import GetDesktopAppStep, { isGetDesktopAppStepEligible } from './steps/GetDesktopAppStep';
import GetMobileAppStep, { isGetMobileAppStepEligible } from './steps/GetMobileAppStep';
import NewOnboardingOrganizationStep, {
    isNewOnboardingOrganizationStepEligible,
} from './steps/NewOnboardingOrganizationStep';
import NewOnboardingThemes, { isNewOnboardingThemesStepEligible } from './steps/NewOnboardingThemes';
import OnboardingWelcomeStep, { isOnboardingWelcomeStepEligible } from './steps/OnboardingWelcomeStep';
import PartnerStep, { isPartnerStepEligible } from './steps/PartnerStep';

interface MailOnboardingProps {
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
    | 'choose-view-layout'
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
    // DAWG-88 add new telemetry
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
    // DAWG-88 add new telemetry
    'activate-premium-features': {
        eligible: isActivatePremiumFeaturesStepEligible,
        component: ActivatePremiumFeaturesStep,
    },
    'choose-view-layout': {
        eligible: isChooseViewLayoutStepEligible,
        component: ChooseViewLayoutStep,
    },
    // DAWG-88 add new telemetry
    partner: {
        eligible: isPartnerStepEligible,
        component: PartnerStep,
    },
    // DAWG-88 add new telemetry
    'display-name': {
        eligible: isDisplayNameStepEligible,
        component: DisplayNameStep,
    },
};

/**
 * DAWG-216: each treatment of the experiment removes one of the four cards of the regular B2C onboarding.
 * Control, a disabled flag and an unknown variant remove nothing.
 */
const getStepRemovedByVariant = (variantName?: string): StepId | undefined => {
    switch (variantName) {
        case 'Treatment1':
            return 'onboarding-welcome';
        case 'Treatment2':
            return 'get-desktop-app';
        case 'Treatment3':
            return 'get-mobile-app';
        case 'Treatment4':
            return 'new-onboarding-themes';
        default:
            return undefined;
    }
};

const MailB2COnboardingModal = (props: MailOnboardingProps) => {
    const { call } = useEventManager();
    const { endReplay, welcomeFlags } = useWelcomeFlags();
    const variant = useVariant('OnboardingStepsExperiment');
    const { flagsReady, flagsError } = useFlagsStatus();
    // The variant is only final once the flags are loaded, or failed to load (the user then stays on the control layout)
    const variantFinal = flagsReady || !!flagsError;
    const dispatch = useMailDispatch();
    const { trackFlowFinished, trackFlowDismissed } = useOnboardingTracking();
    const [loading, setLoading] = useState(true);
    const [imgsToPreload, setImgsToPreload] = useState<string[]>([]);
    const [steps, setSteps] = useState<Set<StepId>>(new Set());

    const getStepComponent = (id: StepId) => {
        const step = steps.has(id);
        return step ? STEPS[id].component : undefined;
    };

    const handleDone = () => {
        trackFlowFinished();
        props.onDone?.();
    };

    useEffect(() => {
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

            // Only users who would see exactly the four regular cards are in the experiment
            const organization = await dispatch(organizationThunk());
            const isRegularB2C = isRegularB2COnboarding({
                stepsToDisplay,
                isReplay: welcomeFlags.isReplay,
                hasGenericWelcomeStep: welcomeFlags.hasGenericWelcomeStep,
                organization,
            });

            if (isRegularB2C) {
                const removedStep = getStepRemovedByVariant(variant.name);
                if (removedStep) {
                    stepsToDisplay.delete(removedStep);
                }
            }

            setImgsToPreload(Array.from(toPreload));
            setSteps(stepsToDisplay);
            setLoading(false);
        };

        if (variantFinal) {
            void init();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-CE595C
    }, [variantFinal]);

    if (loading || !steps) {
        return null;
    }

    return (
        <>
            <OnboardingModal
                {...props}
                onClose={() => {
                    // `onClose` also runs after `onDone`, the tracking ignores it once the flow is finished
                    trackFlowDismissed();

                    // Call the event manager when closing the modal so that BYOE users get as much imported emails as possible
                    void call();
                    endReplay();
                    props.onClose?.();
                }}
                onDone={handleDone}
                modalContentClassname="mx-12 pt-12 pb-6"
                modalClassname="onboarding-modal--larger onboarding-modal--new"
                showGenericSteps={false}
                // Without this the generic theme step is shown even when the step was removed
                hideThemeSetup={!steps.has('new-onboarding-themes')}
                extraProductStep={getStepComponent('activate-premium-features')}
                stepDotClassName="mt-4"
                data-testid="new-onboarding-variant"
                genericSteps={{
                    setupThemeStep: getStepComponent('new-onboarding-themes'),
                    discoverAppsStep: DiscoverAppsStep,
                    organizationStep: getStepComponent('new-onboarding-organization'),
                }}
            >
                {[
                    getStepComponent('display-name'),
                    getStepComponent('partner'),
                    getStepComponent('onboarding-welcome'),
                    // 'choose-view-layout' is shown right after the welcome step, as the second step.
                    getStepComponent('choose-view-layout'),
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
