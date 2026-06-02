import { useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { GetStartedButton } from '@proton/components/components/topnavbar/GetStartedButton';
import { SetupOrganizationNameModal } from '@proton/components/containers/organization/SetupOrganizationNameModal';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces';

import { useOnOrganizationNameSetup } from '../../hooks/useOnOrganizationNameSetup';
import { useOnboarding } from '../../hooks/useOnboarding';
import { ONBOARDING_STEPS } from '../../types/Onboarding';
import { OnboardedQuickActions } from './OnboardedQuickActions';

const GetStartedOnboardingInner = ({ organization }: { organization: OrganizationExtended }) => {
    const { createNotification } = useNotifications();
    const [isBusinessOnboarded, onboarded, completed] = useOnboarding();
    const onOrganizationNameSetup = useOnOrganizationNameSetup();
    const goToSettings = useSettingsLink();

    const [isOrgNameModalDismissed, setIsOrgNameModalDismissed] = useState(false);
    if (isBusinessOnboarded === ONBOARDING_STEPS.NotOnboarded) {
        return (
            <>
                <GetStartedButton onGetStarted={() => setIsOrgNameModalDismissed(false)} />
                <SetupOrganizationNameModal
                    organization={organization}
                    open={!isOrgNameModalDismissed}
                    onClose={() => setIsOrgNameModalDismissed(true)}
                    enableCloseWhenClickOutside
                    onSubmit={(name: string) => {
                        return onOrganizationNameSetup(name)
                            .then(onboarded)
                            .then(() => {
                                setIsOrgNameModalDismissed(true);
                                goToSettings('/users-addresses');
                            })
                            .catch(() => {
                                createNotification({
                                    text: c('Error').t`There was an error, please try again.`,
                                    type: 'error',
                                });
                            });
                    }}
                />
            </>
        );
    }

    if (isBusinessOnboarded === ONBOARDING_STEPS.Onboarded) {
        return <OnboardedQuickActions onDismiss={completed} />;
    }

    return null;
};

export const GetStartedOnboarding = () => {
    const [organization] = useOrganization();

    return organization ? <GetStartedOnboardingInner organization={organization} /> : null;
};
