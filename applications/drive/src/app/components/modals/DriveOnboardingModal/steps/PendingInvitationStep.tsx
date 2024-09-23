import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { OnboardingContent, OnboardingStep } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import driveOnboardingPendingInvite from '@proton/styles/assets/img/illustrations/drive-onboarding-pending-invitation.svg';

import type { StepProps } from './interface';

type Props = {};

export const PendingInvitationStep = ({ onNext }: StepProps<Props>) => {
    return (
        <OnboardingStep>
            <OnboardingContent
                title={
                    <>
                        <span className="block">{c('Onboarding Title').t`Hang tight!`}</span>
                        {c('Onboarding Title').t`Final approval in progress`}
                    </>
                }
                description={
                    <p>
                        {c('Onboarding Info')
                            .t`The owner needs to confirm sharing access. You'll get an email once it's done.`}
                    </p>
                }
                img={<img src={driveOnboardingPendingInvite} alt={DRIVE_APP_NAME} />}
            />
            <footer className="flex flex-nowrap items-center justify-center">
                <Button size="medium" color="norm" className="px-5" fullWidth onClick={onNext}>
                    {c('Action').t`Explore while you wait`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};
