import type { ReactNode } from 'react';
import { type FC, useEffect, useMemo, useState } from 'react';

import type { ModalStateProps } from '@proton/components';
import {
    Loader,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    useApi,
    useDrivePlan,
    useUserSettings,
    useWelcomeFlags,
} from '@proton/components';
import { updateFlags, updateWelcomeFlags } from '@proton/shared/lib/api/settings';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import useDesktopDownloads from '../../../hooks/drive/useDesktopDownloads';
import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { useOnboarding } from '../../onboarding/useOnboarding';
import { Header } from './Header';
import { B2BInviteStep, B2BInviteStepButtons } from './steps/B2BInviteStep';
import { DesktopAppStep, DesktopAppStepButtons } from './steps/DesktopAppStep';
import { MobileAppStep, MobileAppStepButtons } from './steps/MobileAppStep';
import { PendingInvitationStep, PendingInvitationStepButtons } from './steps/PendingInvitationStep';
import { ThemeStep, ThemeStepButtons } from './steps/ThemeStep';
import { UploadStep, UploadStepButtons } from './steps/UploadStep';
import { WelcomeStep, WelcomeStepButtons } from './steps/WelcomeStep';

export const DriveOnboardingV2Modal: FC<ModalStateProps> = (props) => {
    const api = useApi();
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();
    const [userSettings] = useUserSettings();

    const { isLoading: isOnboardingLoading, hasPendingExternalInvitations } = useOnboarding();
    const { isB2B, isAdmin } = useDrivePlan();

    const { downloads: desktopDownloads, isLoading: isDesktopDownloadsLoading } = useDesktopDownloads();
    const isLoading = isOnboardingLoading || isDesktopDownloadsLoading;
    const preferredPlatform = useMemo(
        () => desktopDownloads.find((platform) => platform.isPreferred()),
        [desktopDownloads]
    );

    const [step, setStep] = useState(0);

    // Only show the B2B invite step to admins
    const showB2BInviteStep = isB2B && isAdmin;
    // Only show the desktop app step if there is a platform, and on desktop
    const showDesktopAppStep = !!preferredPlatform && !isMobile();
    // Only show if we have pending invitations
    const showPendingInvitationsStep = !showB2BInviteStep && hasPendingExternalInvitations;
    // Only show upload step on desktop
    const showUploadStep = !isMobile();

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
    ].filter(isTruthy) as [() => ReactNode, () => ReactNode, any][];

    const [Container, Buttons, extraProps] = steps[step] || [];

    const onNext = () => {
        if (step < steps.length - 1) {
            setStep((step) => step + 1);
        } else {
            if (welcomeFlags.isWelcomeFlow) {
                api(updateFlags({ Welcomed: 1 })).catch(noop);
            }
            if (!userSettings.WelcomeFlag) {
                api(updateWelcomeFlags()).catch(noop);
            }
            setWelcomeFlagsDone();

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
