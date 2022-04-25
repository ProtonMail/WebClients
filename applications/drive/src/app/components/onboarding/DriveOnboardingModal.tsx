import { c } from 'ttag';
import { getAppName } from '@proton/shared/lib/apps/helper';
import {
    Button,
    OnboardingContent,
    OnboardingModal,
    OnboardingStep,
    OnboardingStepRenderCallback,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import onboardingWelcome from '@proton/styles/assets/img/onboarding/drive-welcome.svg';

interface Props {
    showGenericSteps?: boolean;
    onDone?: () => void;
    open?: boolean;
}

const DriveOnboardingModal = (props: Props) => {
    const appName = getAppName(APPS.PROTONDRIVE);

    return (
        <OnboardingModal {...props}>
            {[
                ({ onNext, displayGenericSteps }: OnboardingStepRenderCallback) => (
                    <OnboardingStep>
                        <OnboardingContent
                            title={c('Onboarding Title').t`Welcome to ${appName}`}
                            description={c('Onboarding Info')
                                .t`Your trusty online vault for vital documents and precious memories.`}
                            img={<img src={onboardingWelcome} alt={appName} />}
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

export default DriveOnboardingModal;
