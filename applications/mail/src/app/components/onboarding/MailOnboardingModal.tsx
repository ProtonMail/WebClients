import React from 'react';
import { c } from 'ttag';
import {
    AppLink,
    Button,
    OnboardingContent,
    OnboardingModal,
    OnboardingStep,
    OnboardingStepRenderCallback,
    useUser
} from 'react-components';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { APPS } from 'proton-shared/lib/constants';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

import onboardingWelcome from 'design-system/assets/img/onboarding/onboarding-protonmail.svg';
import onboardingWelcomeDark from 'design-system/assets/img/onboarding/onboarding-protonmail-dark.svg';

const MailOnboardingModal = (props: any) => {
    const appName = getAppName(APPS.PROTONMAIL);
    const [user] = useUser();

    const paidUser = user.hasPaidMail;
    const goToImportButton = (
        <AppLink to="/import" toApp={APPS.PROTONMAIL_SETTINGS}>
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
                    close={paidUser ? goToImportButton : null}
                >
                    <OnboardingContent
                        description={c('Onboarding ProtonMail')
                            .t`You can now start sending emails to anyone. We built ${appName} to be both secure and easy to use. Be sure to install our mobile apps and try out tools such as Bridge, which adds Proton encryption to any desktop email app.`}
                        img={<img src={getLightOrDark(onboardingWelcome, onboardingWelcomeDark)} alt={appName} />}
                        text={
                            paidUser
                                ? c('Onboarding ProtonMail')
                                      .t`If you like, we can help you import emails from your existing account. You can either use our Import Assistant or download our Import-Export app, which are available with paid plans.`
                                : c('Onboarding ProtonMail')
                                      .t`If you like, we can help you import emails from your existing accounts. You can use our Import-Export app, which is available with paid plans.`
                        }
                    />
                </OnboardingStep>
            )}
        </OnboardingModal>
    );
};

export default MailOnboardingModal;
