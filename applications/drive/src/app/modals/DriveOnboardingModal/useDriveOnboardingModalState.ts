import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { useWelcomeFlags } from '@proton/account';
import type { ModalStateProps } from '@proton/components';
import { useDrivePlan } from '@proton/components';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import isTruthy from '@proton/utils/isTruthy';

import { useOnboarding } from '../../components/onboarding/useOnboarding';
import { useInitializeFreeUploadTimer } from '../../hooks/drive/freeUpload/useInitializeFreeUploadTimer';
import { useDesktopDownloads } from '../../hooks/drive/useDesktopDownloads';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';
import type { DriveOnboardingModalViewProps } from './DriveOnboardingModalView';
import { B2BInviteStep, B2BInviteStepButtons } from './steps/B2BInviteStep';
import { DesktopAppStep, DesktopAppStepButtons } from './steps/DesktopAppStep';
import { FreeUploadStep, FreeUploadStepButtons } from './steps/FreeUploadStep';
import { MobileAppStep, MobileAppStepButtons } from './steps/MobileAppStep';
import { PendingInvitationStep, PendingInvitationStepButtons } from './steps/PendingInvitationStep';
import { ThemeStep, ThemeStepButtons } from './steps/ThemeStep';
import { UploadStep, UploadStepButtons } from './steps/UploadStep';
import { WelcomeStep, WelcomeStepButtons } from './steps/WelcomeStep';

export const useDriveOnboardingModalState = ({
    open,
    onClose,
    ...modalProps
}: ModalStateProps): DriveOnboardingModalViewProps => {
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

    const showB2BInviteStep = isB2B && isAdmin;
    const showDesktopAppStep = !!preferredPlatform && !isMobile();
    const showPendingInvitationsStep = !showB2BInviteStep && hasPendingExternalInvitations;

    const { eligibleForFreeUpload, initializeTimer } = useInitializeFreeUploadTimer();
    const showUploadStep = !eligibleForFreeUpload && !isMobile();

    useEffect(() => {
        if (open) {
            void countActionWithTelemetry(Actions.OnboardingV2Shown);
        }
    }, [open]);

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

    const onNext = async () => {
        if (step < steps.length - 1) {
            setStep((step) => step + 1);
        } else {
            setWelcomeFlagsDone();

            if (eligibleForFreeUpload) {
                await initializeTimer();
            }

            onClose?.();
        }
    };

    const onBack = step > 0 ? () => setStep((s) => s - 1) : undefined;

    return {
        open,
        onClose,
        ...modalProps,
        isLoading,
        step,
        steps,
        onNext,
        onBack,
    };
};
