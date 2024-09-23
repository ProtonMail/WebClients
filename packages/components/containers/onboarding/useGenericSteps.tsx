import React from 'react';

import { isElectronOnSupportedApps } from '@proton/shared/lib/helpers/desktop';
import { hasVisionary } from '@proton/shared/lib/helpers/subscription';

import { useConfig, useOrganization, useSubscription, useUser } from '../../hooks';
import OnboardingDiscoverApps from './OnboardingDiscoverApps';
import type OnboardingModal from './OnboardingModal';
import OnboardingSetupOrganization from './OnboardingSetupOrganization';
import OnboardingThemes from './OnboardingThemes';
import type { OnboardingStepRenderCallback } from './interface';

type OnboardingModalProps = React.ComponentProps<typeof OnboardingModal>;

interface UseGenericStepsProps
    extends OnboardingStepRenderCallback,
        Pick<OnboardingModalProps, 'hideDiscoverApps' | 'hideOrganizationSetup' | 'genericSteps'> {}

const useGenericSteps = ({
    onNext,
    onBack,
    hideDiscoverApps,
    hideOrganizationSetup,
    genericSteps,
}: UseGenericStepsProps): (React.JSX.Element | null)[] => {
    const { APP_NAME } = useConfig();
    const [user] = useUser();
    const [organization, loadingOrganization] = useOrganization();
    const [subscription, loadingSubscription] = useSubscription();
    const canSetupOrganization =
        !loadingOrganization &&
        !loadingSubscription &&
        user.isAdmin &&
        (organization?.MaxMembers || 0) > 1 &&
        organization?.UsedMembers === 1 &&
        !organization?.HasKeys &&
        !hasVisionary(subscription);

    const setupOrganizationStep = () => {
        if (!canSetupOrganization || hideOrganizationSetup) {
            return null;
        }
        const Component = genericSteps?.organizationStep || OnboardingSetupOrganization;
        return <Component onNext={onNext} onBack={onBack} />;
    };

    const setupThemeStep = () => {
        if (isElectronOnSupportedApps(APP_NAME)) {
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
