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

import onboardingWelcome from 'design-system/assets/img/onboarding/drive-welcome.svg';

const DriveOnboardingModal = (props: any) => {
    const appName = getAppName(APPS.PROTONDRIVE);

    const learnMoreLink = (
        <Href key="learnMoreLink" url="https://protonmail.com/blog/protondrive-security/">
            {c('Onboarding Proton Drive').t`Learn about ${appName} security`}
        </Href>
    );

    return (
        <OnboardingModal {...props}>
            {({ onClose }: OnboardingStepRenderCallback) => (
                <OnboardingStep
                    title={c('Onboarding Proton Drive Title').t`Welcome to ${appName} early access`}
                    submit={c('Onboarding Proton Drive Action').t`Start using ${appName} beta`}
                    onSubmit={onClose}
                    close={null}
                >
                    <OnboardingContent
                        description={
                            <>
                                <div className="mb1">
                                    {c('Onboarding Proton Drive Info')
                                        .t`Your support powers our mission to ensure privacy for all. As a way of saying thanks, you now have early access to our new encrypted cloud storage service.`}
                                </div>
                                <div>
                                    {c('Onboarding Proton Drive Info')
                                        .jt`${appName} currently lets you upload and manage your files, secure your data with end-to-end encryption, and access your account from any device through your web browser. ${learnMoreLink}`}
                                </div>
                            </>
                        }
                        img={<img src={onboardingWelcome} alt={appName} />}
                    />
                </OnboardingStep>
            )}
        </OnboardingModal>
    );
};

export default DriveOnboardingModal;
