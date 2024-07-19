import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import type { OnboardingStepRenderCallback } from '@proton/components';
import {
    Icon,
    Loader,
    ModalTwo,
    ModalTwoContent,
    OnboardingContent,
    OnboardingModal,
    OnboardingStep,
} from '@proton/components';
import { getWelcomeToText } from '@proton/shared/lib/apps/text';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import accountSetupSvg from '@proton/styles/assets/img/illustrations/account-setup.svg';
import driveOnboardingExplore from '@proton/styles/assets/img/illustrations/drive-onboarding-explore.svg';
import driveOnboardingPendingInvite from '@proton/styles/assets/img/illustrations/drive-onboarding-pending-invitation.svg';
import onboardingWelcome from '@proton/styles/assets/img/onboarding/drive-welcome.svg';

import useActiveShare from '../../hooks/drive/useActiveShare';
import { useFileUploadInput } from '../../store';
import { useOnboarding } from '../onboarding/useOnboarding';

interface Props {
    showGenericSteps?: boolean;
    onDone?: () => void;
    open?: boolean;
}

const DriveOnboardingModal = (props: Props) => {
    const {
        isLoading,
        checklist: { expiresInDays },
        hasPendingInvitations,
    } = useOnboarding();
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick: fileClick,
        handleChange: fileChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);

    if (isLoading) {
        return (
            <ModalTwo open={true} size="small">
                <ModalTwoContent className="my-8">
                    <div className="flex flex-column items-center">
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
                    title={getWelcomeToText(DRIVE_APP_NAME)}
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
    const extraProductStep = [];

    if (expiresInDays > 0) {
        onboardingSteps.push(({ onNext, displayGenericSteps }: OnboardingStepRenderCallback) => (
            <OnboardingStep>
                <OnboardingContent
                    title={c('Onboarding Title').t`Your welcome bonus`}
                    description={c('Onboarding Info')
                        .t`Get started using ${DRIVE_APP_NAME} and we'll upgrade your storage to 5 GB!`}
                    img={<img src={accountSetupSvg} alt={DRIVE_APP_NAME} />}
                />
                <div>
                    {c('Onboarding Info').ngettext(
                        msgid`Simply complete the following in the next ${expiresInDays} day:`,
                        `Simply complete the following in the next ${expiresInDays} days:`,
                        expiresInDays
                    )}
                    <ul className="unstyled mt-4">
                        <li className="my-2 flex flex-nowrap">
                            <Icon name="checkmark-circle" className="shrink-0 mr-1 mt-0.5" />
                            <span className="flex-1">{c('Onboarding Info').t`Upload a file`}</span>
                        </li>
                        <li className="my-2 flex flex-nowrap">
                            <Icon name="checkmark-circle" className="shrink-0 mr-1 mt-0.5" />{' '}
                            <span className="flex-1">{c('Onboarding Info').t`Share a file`}</span>
                        </li>
                        <li className="my-2 flex flex-nowrap">
                            <Icon name="checkmark-circle" className="shrink-0 mr-1 mt-0.5" />{' '}
                            <span className="flex-1">{c('Onboarding Info').t`Set a recovery method`}</span>
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
    if (hasPendingInvitations) {
        extraProductStep.push(({ onNext }: OnboardingStepRenderCallback) => (
            <OnboardingStep>
                <OnboardingContent
                    title={
                        <>
                            <span className="block">{c('Onboarding Title').t`Hang tight!`}</span>
                            {c('Onboarding Title').t`Final approval in progress`}
                        </>
                    }
                    description={
                        <p>{c('Onboarding Info')
                            .t`The owner needs to confirm sharing access. You’ll get an email once it’s done.`}</p>
                    }
                    img={<img src={driveOnboardingPendingInvite} alt={DRIVE_APP_NAME} />}
                />
                <footer className="flex flex-nowrap items-center justify-center">
                    <Button size="medium" color="norm" className="px-5" fullWidth onClick={onNext}>{c('Action')
                        .t`Explore while you wait`}</Button>
                </footer>
            </OnboardingStep>
        ));
        extraProductStep.push(({ onNext }: OnboardingStepRenderCallback) => (
            <OnboardingStep>
                <OnboardingContent
                    title={c('Onboarding Title').t`Upload and protect your important files`}
                    description={
                        <p>{c('Onboarding Info')
                            .t`Store your files and share them securely. Get started by securing your most private files, like IDs, contracts, and personal photos.`}</p>
                    }
                    img={<img src={driveOnboardingExplore} alt={DRIVE_APP_NAME} />}
                />
                <footer className="flex flex-nowrap gap-3">
                    <input
                        multiple
                        type="file"
                        ref={fileInput}
                        className="hidden"
                        onChange={(e) => {
                            fileChange(e);
                            onNext();
                        }}
                    />
                    <Button className="w-1/2" size="medium" onClick={onNext}>{c('Action').t`Explore on my own`}</Button>
                    <Button className="w-1/2" size="medium" color="norm" onClick={fileClick}>
                        {c('Action').t`Upload files`}
                    </Button>
                </footer>
            </OnboardingStep>
        ));
    }

    return (
        <OnboardingModal {...props} extraProductStep={extraProductStep}>
            {onboardingSteps}
        </OnboardingModal>
    );
};

export default DriveOnboardingModal;
