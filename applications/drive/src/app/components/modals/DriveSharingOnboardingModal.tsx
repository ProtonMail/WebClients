import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { OnboardingContent, OnboardingModal, OnboardingStep, OnboardingStepRenderCallback } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
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
                    title={c('Onboarding Info').t`Private Access Sharing`}
                    description={c('Onboarding Info')
                        .t`Invite others by email to view and edit your ${DRIVE_APP_NAME} files`}
                    img={<img src={sharingOnboardingWelcome} alt={DRIVE_APP_NAME} />}
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
