import React from 'react';
import { c } from 'ttag';
import { getAppName } from 'proton-shared/lib/apps/helper';
import {
    Href,
    OnboardingContent,
    OnboardingModal,
    OnboardingStep,
    OnboardingStepRenderCallback,
} from 'react-components';
import { APPS } from 'proton-shared/lib/constants';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

import onboardingWelcome from 'design-system/assets/img/onboarding/onboarding-protondrive.svg';
import onboardingWelcomeDark from 'design-system/assets/img/onboarding/onboarding-protondrive-dark.svg';

const DriveOnboardingModal = (props: any) => {
    const appName = getAppName(APPS.PROTONDRIVE);

    const learnMoreLink = (
        <Href url="https://protonmail.com/blog/protondrive-security/">{c('Onboarding ProtonDrive')
            .t`Learn about ProtonDrive security`}</Href>
    );

    return (
        <OnboardingModal {...props}>
            {({ onClose }: OnboardingStepRenderCallback) => (
                <OnboardingStep
                    title={c('Onboarding ProtonDrive Title').t`Welcome to ${appName} early access`}
                    submit={c('Onboarding ProtonDrive Action').t`Start using ${appName} beta`}
                    onSubmit={onClose}
                    close={null}
                >
                    <OnboardingContent
                        description={c('Onboarding ProtonDrive Info')
                            .t`Your support powers our mission to ensure privacy for all. As a way of saying thanks, you now have early access to our new encrypted cloud storage service.`}
                        img={<img src={getLightOrDark(onboardingWelcome, onboardingWelcomeDark)} alt={appName} />}
                        text={c('Onboarding ProtonDrive Info')
                            .jt`${appName} currently lets you upload and manage your files, secure your data with end-to-end encryption, and access your account from any device through your web browser. ${learnMoreLink}`}
                    />
                </OnboardingStep>
            )}
        </OnboardingModal>
    );
};

export default DriveOnboardingModal;
