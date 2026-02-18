import type { ReactNode } from 'react';
import { type FC, useEffect, useMemo, useState } from 'react';

import { useWelcomeFlags } from '@proton/account';
import type { ModalStateProps } from '@proton/components';
import { Loader, ModalTwo, ModalTwoContent, ModalTwoFooter, useDrivePlan } from '@proton/components';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import isTruthy from '@proton/utils/isTruthy';

import { useInitializeFreeUploadTimer } from '../../../hooks/drive/freeUpload/useInitializeFreeUploadTimer';
import { useDesktopDownloads } from '../../../hooks/drive/useDesktopDownloads';
import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { useOnboarding } from '../../onboarding/useOnboarding';
import { Header } from './Header';
import { B2BInviteStep, B2BInviteStepButtons } from './steps/B2BInviteStep';
import { DesktopAppStep, DesktopAppStepButtons } from './steps/DesktopAppStep';
import { FreeUploadStep, FreeUploadStepButtons } from './steps/FreeUploadStep';
import { MobileAppStep, MobileAppStepButtons } from './steps/MobileAppStep';
import { PendingInvitationStep, PendingInvitationStepButtons } from './steps/PendingInvitationStep';
import { ThemeStep, ThemeStepButtons } from './steps/ThemeStep';
import { UploadStep, UploadStepButtons } from './steps/UploadStep';
import { WelcomeStep, WelcomeStepButtons } from './steps/WelcomeStep';

export const DriveOnboardingV2Modal: FC<ModalStateProps> = (props) => {
    const { setDone: setWelcomeFlagsDone } = useWelcomeFlags();

    const { isLoading: isOnboardingLoading, hasPendingExternalInvitations } = useOnboarding();
    const { isB2B, isAdmin } = useDrivePlan();

    const { downloads: desktopDownloads, isLoading: isDesktopDownloadsLoading } = useDesktopDownloads();
    const isLoading = isOnboardingLoading || isDesktopDownloadsLoading;
    const preferredPlatform = useMemo(
        () => desktopDownloads.find((platform) => platform.isPreferred),
        [desktopDownloads]
    );

    const [step, setStep] = useState(0);

    // Only show the B2B invite step to admins
    const showB2BInviteStep = isB2B && isAdmin;
    // Only show the desktop app step if there is a platform, and on desktop
    const showDesktopAppStep = !!preferredPlatform && !isMobile();
    // Only show if we have pending invitations
    const showPendingInvitationsStep = !showB2BInviteStep && hasPendingExternalInvitations;

    const { eligibleForFreeUpload, initializeTimer } = useInitializeFreeUploadTimer();

    // Only show upload step on desktop
    const showUploadStep = !eligibleForFreeUpload && !isMobile();

    useEffect(() => {
        if (props.open) {
            countActionWithTelemetry(Actions.OnboardingV2Shown);
        }
    }, [props.open]);

    if (isLoading) {
        return (
            <ModalTwo open fullscreenOnMobile blurBackdrop size="xlarge">
                <ModalTwoContent className="my-8">
                    <div className="flex flex-column items-center">
                        <Loader size="medium" className="my-4" />
                    </div>
                </ModalTwoContent>
            </ModalTwo>
        );
    }

    const steps = [
        [WelcomeStep, WelcomeStepButtons],
        [ThemeStep, ThemeStepButtons],
        showDesktopAppStep && [
            DesktopAppStep,
            DesktopAppStepButtons,
            {
                download: preferredPlatform.startDownload,
                platform: preferredPlatform.platform,
            },
        ],
        [MobileAppStep, MobileAppStepButtons],
        showB2BInviteStep && [B2BInviteStep, B2BInviteStepButtons],
        showPendingInvitationsStep && [PendingInvitationStep, PendingInvitationStepButtons],
        showUploadStep && [UploadStep, UploadStepButtons],
        eligibleForFreeUpload && [FreeUploadStep, FreeUploadStepButtons],
    ].filter(isTruthy) as [() => ReactNode, () => ReactNode, any][];

    const [Container, Buttons, extraProps] = steps[step] || [];

    const onNext = async () => {
        if (step < steps.length - 1) {
            setStep((step) => step + 1);
        } else {
            // Last step
            setWelcomeFlagsDone();

            if (eligibleForFreeUpload) {
                await initializeTimer();
            }

            props.onClose?.();
        }
    };

    return (
        <ModalTwo {...props} fullscreenOnMobile blurBackdrop size="xlarge" data-testid="drive-onboarding-v2">
            <ModalTwoContent className="my-8">
                <Header
                    currentStep={step}
                    maxSteps={steps.length}
                    onBack={step > 0 ? () => setStep((step) => step - 1) : undefined}
                />
                <Container {...extraProps} onNext={onNext} />
            </ModalTwoContent>

            <ModalTwoFooter>
                <Buttons {...extraProps} onNext={onNext} />
            </ModalTwoFooter>
        </ModalTwo>
    );
};
