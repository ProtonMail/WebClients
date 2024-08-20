import type { ReactNode } from 'react';

import type { OnboardingStepRenderCallback } from '@proton/components';
import { Loader, ModalTwo, ModalTwoContent, OnboardingModal, useDrivePlan } from '@proton/components';

import { useOnboarding } from '../../onboarding/useOnboarding';
import { B2BInviteStep, PendingInvitationStep, SignupBonusStep, WelcomeStep } from './steps';
import { ExploreStep } from './steps/ExploreStep';

interface Props {
    showGenericSteps?: boolean;
    onDone?: () => void;
    open?: boolean;
}

export const DriveOnboardingModal = (props: Props) => {
    const {
        isLoading,
        checklist: { expiresInDays },
        hasPendingExternalInvitations,
    } = useOnboarding();

    const { isB2B, isAdmin } = useDrivePlan();

    // Hide the welcome bonus step for B2B users, as it doesn't make sense for them
    const showWelcomeBonusStep = expiresInDays > 0 && !isB2B;
    // Only show the B2B invite step to admins
    const showB2BInviteStep = isB2B && isAdmin;
    // Only show if we have pending invitations
    const showPendingInvitationsStep = !showB2BInviteStep && hasPendingExternalInvitations;

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

    const onboardingSteps = (
        [
            (props) => (
                <WelcomeStep
                    {...props}
                    isB2B={isB2B}
                    hasNextStep={
                        props.displayGenericSteps ||
                        showWelcomeBonusStep ||
                        showB2BInviteStep ||
                        showPendingInvitationsStep
                    }
                />
            ),
            showWelcomeBonusStep &&
                ((props) => (
                    <SignupBonusStep
                        {...props}
                        expiresInDays={expiresInDays}
                        hasNextStep={props.displayGenericSteps || showB2BInviteStep || showPendingInvitationsStep}
                    />
                )),
        ] as ((props: OnboardingStepRenderCallback) => ReactNode)[]
    ).filter(Boolean);

    const extraProductStep = (
        [
            showB2BInviteStep && ((props) => <B2BInviteStep {...props} />),
            showPendingInvitationsStep && ((props) => <PendingInvitationStep {...props} />),
            showPendingInvitationsStep && ((props) => <ExploreStep {...props} />),
        ] as ((props: OnboardingStepRenderCallback) => ReactNode)[]
    ).filter(Boolean);

    return (
        <OnboardingModal
            {...props}
            hideDiscoverApps={isB2B}
            hideOrganizationSetup={showB2BInviteStep}
            extraProductStep={extraProductStep}
        >
            {onboardingSteps}
        </OnboardingModal>
    );
};
