import React from 'react';
import { c } from 'ttag';
import {
    AppLink,
    Button,
    OnboardingContent,
    OnboardingModal,
    OnboardingStep,
    OnboardingStepRenderCallback,
} from 'react-components';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { APPS } from 'proton-shared/lib/constants';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

import onboardingWelcome from 'design-system/assets/img/onboarding/onboarding-protonmail.svg';
import onboardingWelcomeDark from 'design-system/assets/img/onboarding/onboarding-protonmail-dark.svg';

const MailOnboardingModal = (props: any) => {
    const appName = getAppName(APPS.PROTONMAIL);

    const goToImportButton = (
        <AppLink to="/settings/import" toApp={APPS.PROTONMAIL}>
            <Button>{c('Action').t`Import your emails`}</Button>
        </AppLink>
    );

    return (
        <OnboardingModal {...props}>
            {({ onClose }: OnboardingStepRenderCallback) => (
                <OnboardingStep
                    title={c('Onboarding ProtonMail').t`Your secure inbox is ready`}
                    submit={c('Onboarding').t`Start using ${appName}`}
                    onSubmit={onClose}
                    close={goToImportButton}
                >
                    <OnboardingContent
                        description={
                            <>
                                <div className="mb1">
                                    {c('Onboarding ProtonMail')
                                        .t`You can now start sending emails to anyone. We built ${appName} to be both secure and easy to use. Be sure to install our mobile apps and try out tools such as Bridge, which adds Proton encryption to any desktop email app.`}
                                </div>
                            </>
                        }
                        img={<img src={getLightOrDark(onboardingWelcome, onboardingWelcomeDark)} alt={appName} />}
                        text={c('Onboarding ProtonMail')
                            .t`If you like, we can help you import emails from your existing account. You can either use our Import Assistant or download our Import-Export app, which is available with paid plans.`}
                    />
                </OnboardingStep>
            )}
        </OnboardingModal>
    );
};

export default MailOnboardingModal;
