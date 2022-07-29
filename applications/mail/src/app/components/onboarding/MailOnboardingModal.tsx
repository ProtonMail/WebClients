import { c } from 'ttag';

import {
    Button,
    OnboardingContent,
    OnboardingModal,
    OnboardingStep,
    OnboardingStepRenderCallback,
} from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import onboardingMailWelcome from '@proton/styles/assets/img/onboarding/mail-welcome.svg';

interface Props {
    showGenericSteps?: boolean;
    onDone?: () => void;
    onExit?: () => void;
    open?: boolean;
}

const MailOnboardingModal = (props: Props) => {
    const appName = MAIL_APP_NAME;
    return (
        <OnboardingModal {...props}>
            {[
                ({ onNext, displayGenericSteps }: OnboardingStepRenderCallback) => (
                    <OnboardingStep>
                        <OnboardingContent
                            img={<img src={onboardingMailWelcome} alt={c('Onboarding').t`Welcome to ${appName}`} />}
                            title={c('Onboarding').t`Welcome to ${appName}`}
                            description={c('Onboarding')
                                .t`Where privacy and security meet productivity and ease of use.`}
                        />
                        <footer>
                            <Button size="large" color="norm" fullWidth onClick={onNext}>
                                {displayGenericSteps
                                    ? c('Onboarding Action').t`Next`
                                    : c('Onboarding Action').t`Start using ${appName}`}
                            </Button>
                        </footer>
                    </OnboardingStep>
                ),
            ]}
        </OnboardingModal>
    );
};

export default MailOnboardingModal;
