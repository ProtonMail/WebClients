import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { OnboardingContent, OnboardingModal, OnboardingStep, OnboardingStepRenderCallback } from '@proton/components';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import onboardingWelcome from '@proton/styles/assets/img/onboarding/calendar-welcome.svg';

interface Props {
    showGenericSteps?: boolean;
    onDone?: () => void;
    open?: boolean;
}

const CalendarOnboardingModal = (props: Props) => {
    const appName = CALENDAR_APP_NAME;

    return (
        <OnboardingModal {...props}>
            {[
                ({ onNext, displayGenericSteps }: OnboardingStepRenderCallback) => {
                    return (
                        <OnboardingStep>
                            <OnboardingContent
                                title={c('Onboarding').t`Welcome to ${appName}`}
                                description={c('Onboarding').t`Where you can take control of your time and your data.`}
                                img={<img src={onboardingWelcome} alt={appName} />}
                            />
                            <footer className="flex flex-nowrap">
                                <Button size="large" color="norm" fullWidth onClick={onNext}>
                                    {displayGenericSteps
                                        ? c('Onboarding Action').t`Next`
                                        : c('Onboarding Action').t`Start using ${appName}`}
                                </Button>
                            </footer>
                        </OnboardingStep>
                    );
                },
            ]}
        </OnboardingModal>
    );
};

export default CalendarOnboardingModal;
