import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { OnboardingContent, OnboardingStep } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import driveOnboardingExplore from '@proton/styles/assets/img/illustrations/drive-onboarding-explore.svg';

import { useActiveShare } from '../../../../hooks/drive/useActiveShare';
import { useFileUploadInput } from '../../../../store/_uploads/useUploadInput';
import type { StepProps } from './interface';

type Props = {};

export const ExploreStep = ({ onNext }: StepProps<Props>) => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick: fileClick,
        handleChange: fileChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);

    return (
        <OnboardingStep>
            <OnboardingContent
                title={c('Onboarding Title').t`Upload and protect your important files`}
                description={
                    <p>
                        {c('Onboarding Info')
                            .t`Store your files and share them securely. Get started by securing your most private files, like IDs, contracts, and personal photos.`}
                    </p>
                }
                img={<img src={driveOnboardingExplore} alt={DRIVE_APP_NAME} />}
            />
            <footer className="flex flex-nowrap items-center justify-center gap-4">
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
                <Button fullWidth size="medium" onClick={onNext}>
                    {c('Action').t`Explore on my own`}
                </Button>
                <Button fullWidth size="medium" color="norm" onClick={fileClick}>
                    {c('Action').t`Upload files`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};
