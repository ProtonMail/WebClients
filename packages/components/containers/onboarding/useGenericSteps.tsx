import type { JSX } from 'react';
import React from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { isElectronOnSupportedApps } from '@proton/shared/lib/helpers/desktop';

import OnboardingDiscoverApps from './OnboardingDiscoverApps';
import type OnboardingModal from './OnboardingModal';
import OnboardingSetupOrganization from './OnboardingSetupOrganization';
import OnboardingThemes from './OnboardingThemes';
import { canSetupOrganization } from './canSetupOrganization';
import type { OnboardingStepRenderCallback } from './interface';

type OnboardingModalProps = React.ComponentProps<typeof OnboardingModal>;

interface UseGenericStepsProps
    extends
        OnboardingStepRenderCallback,
        Pick<OnboardingModalProps, 'hideDiscoverApps' | 'hideOrganizationSetup' | 'hideThemeSetup' | 'genericSteps'> {}

const useGenericSteps = ({
    onNext,
    onBack,
    hideDiscoverApps,
    hideOrganizationSetup,
    hideThemeSetup,
    genericSteps,
}: UseGenericStepsProps): (JSX.Element | null)[] => {
    const { APP_NAME } = useConfig();
    const [user] = useUser();
    const [organization, loadingOrganization] = useOrganization();
    const [subscription, loadingSubscription] = useSubscription();
    const canSetupOrganizationStep =
        !loadingOrganization && !loadingSubscription && canSetupOrganization({ user, organization, subscription });

    const setupOrganizationStep = () => {
        if (!canSetupOrganizationStep || hideOrganizationSetup) {
            return null;
        }
        const Component = genericSteps?.organizationStep || OnboardingSetupOrganization;
        return <Component onNext={onNext} onBack={onBack} />;
    };

    const setupThemeStep = () => {
        if (hideThemeSetup || isElectronOnSupportedApps(APP_NAME)) {
            return null;
        }
        const Component = genericSteps?.setupThemeStep || OnboardingThemes;
        return <Component onNext={onNext} onBack={onBack} />;
    };

    const setupDiscoverAppsStep = () => {
        if (hideDiscoverApps) {
            return null;
        }
        const Component = genericSteps?.discoverAppsStep || OnboardingDiscoverApps;

        return <Component onNext={onNext} onBack={onBack} />;
    };

    return [setupThemeStep(), setupOrganizationStep(), setupDiscoverAppsStep()];
};

export default useGenericSteps;
