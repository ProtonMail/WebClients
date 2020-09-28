import { c } from 'ttag';
import { OnboardingContent, OnboardingModal, OnboardingStep, useAppLink } from 'react-components';
import React from 'react';
import { APPS } from 'proton-shared/lib/constants';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import { getAccountSettingsApp, getAppName } from 'proton-shared/lib/apps/helper';

import onboardingWelcome from 'design-system/assets/img/onboarding/onboarding-protondrive.svg';
import onboardingWelcomeDark from 'design-system/assets/img/onboarding/onboarding-protondrive-dark.svg';

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
                    title={c('Onboarding ProtonDrive').t`Welcome to ${appName}`}
                    close={null}
                    submit={c('Onboarding ProtonDrive').t`Back to your Dashboard`}
                    onSubmit={handleBack}
                >
                    <OnboardingContent
                        description={c('Onboarding ProtonDrive')
                            .t`${appName} is currently in early access and only available to invited users of ${mailAppName}.`}
                        img={<img src={getLightOrDark(onboardingWelcome, onboardingWelcomeDark)} alt={appName} />}
                        text={c('Onboarding ProtonDrive').t`${appName} will be available to all users upon launch.`}
                    />
                </OnboardingStep>
            )}
        </OnboardingModal>
    );
};

export default DriveOnboardingModalNoAccess;
