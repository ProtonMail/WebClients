import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { OnboardingContent, OnboardingModal, OnboardingStep, OnboardingStepRenderCallback } from '@proton/components';
import sharingOnboardingWelcome from '@proton/styles/assets/img/onboarding/drive-sharing-welcome.svg';

interface Props {
    showGenericSteps?: boolean;
    onDone?: () => void;
    open?: boolean;
}

const DriveSharingOnboardingModal = (props: Props) => {
    const onboardingSteps = [
        ({ onNext }: OnboardingStepRenderCallback) => (
            <OnboardingStep>
                <OnboardingContent
                    title={c('Onboarding Info').t`Share files with one click`}
                    description={c('Onboarding Info')
                        .t`Invite others via email to view and edit your files, or create a public link for quick access`}
                    img={
                        <img src={sharingOnboardingWelcome} alt={c('Onboarding Info').t`Share files with one click`} />
                    }
                />
                <footer>
                    <Button size="large" color="norm" fullWidth onClick={onNext}>
                        {c('Onboarding Action').t`Got it`}
                    </Button>
                </footer>
            </OnboardingStep>
        ),
    ];

    return <OnboardingModal {...props}>{onboardingSteps}</OnboardingModal>;
};

export default DriveSharingOnboardingModal;
