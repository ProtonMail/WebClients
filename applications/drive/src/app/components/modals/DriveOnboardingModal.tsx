import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Icon,
    Loader,
    ModalTwo,
    ModalTwoContent,
    OnboardingContent,
    OnboardingModal,
    OnboardingStep,
    OnboardingStepRenderCallback,
} from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import drive1gbSvg from '@proton/styles/assets/img/onboarding/drive-1gb.svg';
import onboardingWelcome from '@proton/styles/assets/img/onboarding/drive-welcome.svg';

import useChecklist from '../onboarding/useChecklist';

interface Props {
    showGenericSteps?: boolean;
    onDone?: () => void;
    open?: boolean;
}

const DriveOnboardingModal = (props: Props) => {
    const { isLoading, expiresInDays } = useChecklist();

    if (isLoading) {
        return (
            <ModalTwo open={true} size="small">
                <ModalTwoContent className="my-8">
                    <div className="flex flex-column flex-align-items-center">
                        <Loader size="medium" className="my-4" />
                    </div>
                </ModalTwoContent>
            </ModalTwo>
        );
    }

    const onboardingSteps = [
        ({ onNext, displayGenericSteps }: OnboardingStepRenderCallback) => (
            <OnboardingStep>
                <OnboardingContent
                    title={c('Onboarding Title').t`Welcome to ${DRIVE_APP_NAME}`}
                    description={c('Onboarding Info')
                        .t`Your trusty online vault for vital documents and precious memories.`}
                    img={<img src={onboardingWelcome} alt={DRIVE_APP_NAME} />}
                />
                <footer>
                    <Button size="large" color="norm" fullWidth onClick={onNext}>
                        {displayGenericSteps || expiresInDays > 0
                            ? c('Onboarding Action').t`Next`
                            : c('Onboarding Action').t`Start using ${DRIVE_APP_NAME}`}
                    </Button>
                </footer>
            </OnboardingStep>
        ),
    ];

    if (expiresInDays > 0) {
        onboardingSteps.push(({ onNext, displayGenericSteps }: OnboardingStepRenderCallback) => (
            <OnboardingStep>
                <OnboardingContent
                    title={c('Onboarding Title').t`Your welcome bonus`}
                    description={c('Onboarding Info')
                        .t`Get started using ${DRIVE_APP_NAME} and we'll double your free storage to 1GB!`}
                    img={<img src={drive1gbSvg} alt={DRIVE_APP_NAME} />}
                />
                <div>
                    {c('Onboarding Info').ngettext(
                        msgid`Simply complete the following in the next ${expiresInDays} day:`,
                        `Simply complete the following in the next ${expiresInDays} days:`,
                        expiresInDays
                    )}
                    <ul className="unstyled mt-4">
                        <li className="my-2 flex flex-nowrap">
                            <Icon name="checkmark-circle" className="flex-item-noshrink mr-1 mt-0.5" />
                            <span className="flex-item-fluid">{c('Onboarding Info').t`Upload a file`}</span>
                        </li>
                        <li className="my-2 flex flex-nowrap">
                            <Icon name="checkmark-circle" className="flex-item-noshrink mr-1 mt-0.5" />{' '}
                            <span className="flex-item-fluid">{c('Onboarding Info').t`Create a share link`}</span>
                        </li>
                        <li className="my-2 flex flex-nowrap">
                            <Icon name="checkmark-circle" className="flex-item-noshrink mr-1 mt-0.5" />{' '}
                            <span className="flex-item-fluid">{c('Onboarding Info').t`Set a recovery method`}</span>
                        </li>
                    </ul>
                </div>
                <footer>
                    <Button size="large" color="norm" fullWidth onClick={onNext}>
                        {displayGenericSteps
                            ? c('Onboarding Action').t`Next`
                            : c('Onboarding Action').t`Start using ${DRIVE_APP_NAME}`}
                    </Button>
                </footer>
            </OnboardingStep>
        ));
    }

    return <OnboardingModal {...props}>{onboardingSteps}</OnboardingModal>;
};

export default DriveOnboardingModal;
