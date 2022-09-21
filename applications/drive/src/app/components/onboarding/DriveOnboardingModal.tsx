import { c, msgid } from 'ttag';

import {
    Button,
    Icon,
    InnerModal,
    Loader,
    ModalTwo,
    OnboardingContent,
    OnboardingModal,
    OnboardingStep,
    OnboardingStepRenderCallback,
} from '@proton/components';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import drive1gbSvg from '@proton/styles/assets/img/onboarding/drive-1gb.svg';
import onboardingWelcome from '@proton/styles/assets/img/onboarding/drive-welcome.svg';

import useChecklist from './useChecklist';

interface Props {
    showGenericSteps?: boolean;
    onDone?: () => void;
    open?: boolean;
}

const DriveOnboardingModal = (props: Props) => {
    const appName = getAppName(APPS.PROTONDRIVE);

    const { isLoading, expiresInDays } = useChecklist();

    if (isLoading) {
        return (
            <ModalTwo open={true} size="small">
                <InnerModal className="mt2 mb2">
                    <div className="flex flex-column flex-align-items-center">
                        <Loader size="medium" className="mt1 mb1" />
                    </div>
                </InnerModal>
            </ModalTwo>
        );
    }

    const onboardingSteps = [
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
                        {displayGenericSteps || expiresInDays > 0
                            ? c('Onboarding Action').t`Next`
                            : c('Onboarding Action').t`Start using ${appName}`}
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
                        .t`Get started using Proton Drive and we'll double your free storage to 1GB!`}
                    img={<img src={drive1gbSvg} alt={appName} />}
                />
                <div>
                    {c('Onboarding Info').ngettext(
                        msgid`Simply complete the following in the next ${expiresInDays} day:`,
                        `Simply complete the following in the next ${expiresInDays} days:`,
                        expiresInDays
                    )}
                    <ul className="unstyled mt1">
                        <li className="my0-5">
                            <Icon name="checkmark-circle" /> {c('Onboarding Info').t`Upload a file`}
                        </li>
                        <li className="my0-5">
                            <Icon name="checkmark-circle" /> {c('Onboarding Info').t`Create a share link`}
                        </li>
                        <li className="my0-5">
                            <Icon name="checkmark-circle" /> {c('Onboarding Info').t`Set a recovery method`}
                        </li>
                    </ul>
                </div>
                <footer>
                    <Button size="large" color="norm" fullWidth onClick={onNext}>
                        {displayGenericSteps
                            ? c('Onboarding Action').t`Next`
                            : c('Onboarding Action').t`Start using ${appName}`}
                    </Button>
                </footer>
            </OnboardingStep>
        ));
    }

    return <OnboardingModal {...props}>{onboardingSteps}</OnboardingModal>;
};

export default DriveOnboardingModal;
