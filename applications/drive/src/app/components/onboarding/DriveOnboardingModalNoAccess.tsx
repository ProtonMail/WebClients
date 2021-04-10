import { c } from 'ttag';
import { OnboardingContent, OnboardingModal, OnboardingStep, useAppLink } from 'react-components';
import React from 'react';
import { APPS } from 'proton-shared/lib/constants';
import { getAccountSettingsApp, getAppName } from 'proton-shared/lib/apps/helper';

import onboardingWelcome from 'design-system/assets/img/onboarding/drive-upgrade.svg';

const DriveOnboardingModalNoAccess = (props: any) => {
    const goToApp = useAppLink();

    const appName = getAppName(APPS.PROTONDRIVE);
    const mailAppName = getAppName(APPS.PROTONMAIL);

    const handleBack = () => {
        goToApp('/', getAccountSettingsApp());
    };

    return (
        <OnboardingModal setWelcomeFlags={false} {...props}>
            {() => (
                <OnboardingStep
                    title={c('Onboarding Proton Drive Title').t`Welcome to ${appName}`}
                    close={null}
                    submit={c('Onboarding Proton Drive Action').t`Back to your dashboard`}
                    onSubmit={handleBack}
                >
                    <OnboardingContent
                        description={c('Onboarding Proton Drive Info')
                            .t`${appName} is currently in early access and only available to invited users of ${mailAppName}.`}
                        img={<img src={onboardingWelcome} alt={appName} />}
                        text={c('Onboarding Proton Drive Info')
                            .t`${appName} will be available to all users upon launch.`}
                    />
                </OnboardingStep>
            )}
        </OnboardingModal>
    );
};

export default DriveOnboardingModalNoAccess;
