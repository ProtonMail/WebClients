import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import NotificationButton from '@proton/components/containers/notifications/NotificationButton';
import { isDesktopEnvironment } from '@proton/lumo-api-client/core/desktop-tools';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectMasterKeyState } from '../../redux/selectors';
import type { DesktopOnboardingDismissMethod, DesktopOnboardingPlatform } from '../../util/telemetry';
import {
    sendDesktopOnboardingDismissedEvent,
    sendDesktopOnboardingDownloadEvent,
    sendDesktopOnboardingShownEvent,
} from '../../util/telemetry';
import { DesktopOnboardingModal } from './DesktopOnboardingModal';
import {
    LUMO_DESKTOP_DOWNLOAD_PAGE,
    fetchLumoDesktopInstallerUrl,
    getLumoDesktopTarget,
    startInstallerDownload,
} from './desktopDownloads';
import type { DesktopOnboardingOutcome } from './desktopOnboardingStorage';
import {
    hasSeenDesktopOnboarding,
    markDesktopOnboardingOutcome,
    markDesktopOnboardingShown,
} from './desktopOnboardingStorage';
import { getDesktopOnboardingSurface, getDesktopOnboardingVariant } from './desktopOnboardingSurface';

/** Same delay as the What's new modal, so the app has settled before the modal opens. */
const OPEN_DELAY_MS = 500;

/**
 * idle: not shown (yet) · waiting: about to open · open: on screen · done: shown in this session.
 */
type Phase = 'idle' | 'waiting' | 'open' | 'done';

interface DesktopOnboardingContextValue {
    /** True while the introduction is due, open, or was shown in this session. */
    isDesktopOnboardingBlocking: boolean;
}

const DesktopOnboardingContext = createContext<DesktopOnboardingContextValue>({ isDesktopOnboardingBlocking: false });

/**
 * Other on-load onboarding and upsells (What's new, announcement and survey panels) check this and
 * stay hidden, so the desktop introduction takes precedence and nothing stacks on top of it.
 */
export const useIsDesktopOnboardingBlocking = (): boolean => {
    return useContext(DesktopOnboardingContext).isDesktopOnboardingBlocking;
};

interface OnboardingBlockingProviderProps {
    isBlocking: boolean;
    children: ReactNode;
}

/**
 * Lets another onboarding (the desktop app tour) hold back the same panels. Blocking if this
 * one or any outer one is.
 */
export const OnboardingBlockingProvider = ({ isBlocking, children }: OnboardingBlockingProviderProps) => {
    const isParentBlocking = useIsDesktopOnboardingBlocking();
    const isDesktopOnboardingBlocking = isParentBlocking || isBlocking;
    const value = useMemo(() => {
        return { isDesktopOnboardingBlocking };
    }, [isDesktopOnboardingBlocking]);
    return <DesktopOnboardingContext.Provider value={value}>{children}</DesktopOnboardingContext.Provider>;
};

interface Props {
    children: ReactNode;
}

/**
 * One-time "Meet Lumo for desktop" introduction, shown on app load when the
 * LumoDesktopOnboardingModal flag is on. Once per device: the record lives in local storage.
 */
export const DesktopOnboardingProvider = ({ children }: Props) => {
    const { desktopOnboardingModal: isFlagEnabled } = useLumoFlags();
    const isGuest = useIsGuest();
    const isMasterKeyReady = useLumoSelector(selectMasterKeyState).status === 'ready';
    const { createNotification, hideNotification } = useNotifications();

    const [hasSeen] = useState(hasSeenDesktopOnboarding);
    const [phase, setPhase] = useState<Phase>('idle');
    const surface = useMemo(getDesktopOnboardingSurface, []);
    const variant = getDesktopOnboardingVariant(surface);
    const target = useMemo(getLumoDesktopTarget, []);
    const telemetryPlatform: DesktopOnboardingPlatform =
        variant === 'got-it' ? 'mobile' : (target?.platform ?? 'unknown');
    const installerUrlRef = useRef<Promise<string | undefined> | null>(null);

    const { modalProps, openModal, render } = useModalStateObject();

    const isEligible = isFlagEnabled && !isGuest && !hasSeen && !isDesktopEnvironment();
    const isBlocking = phase !== 'idle' || isEligible;

    useNativeComposerVisibilityApi({ hideComposer: render && modalProps.open });

    useEffect(() => {
        if (phase === 'idle' && isEligible && isMasterKeyReady) {
            setPhase('waiting');
        }
    }, [phase, isEligible, isMasterKeyReady]);

    useEffect(() => {
        if (phase !== 'waiting') {
            return;
        }
        const timer = window.setTimeout(() => {
            markDesktopOnboardingShown();
            sendDesktopOnboardingShownEvent({ surface, platform: telemetryPlatform });
            if (variant === 'download' && target) {
                // Load the release file while the modal is open, so the click starts the download straight away.
                installerUrlRef.current = fetchLumoDesktopInstallerUrl(target).catch((error) => {
                    console.warn('Could not load the Lumo desktop release file', error);
                    return undefined;
                });
            }
            setPhase('open');
            openModal(true);
        }, OPEN_DELAY_MS);
        return () => {
            window.clearTimeout(timer);
        };
    }, [phase]);

    const finish = useCallback(
        (outcome: DesktopOnboardingOutcome) => {
            markDesktopOnboardingOutcome(outcome);
            setPhase('done');
            openModal(false);
        },
        [openModal]
    );

    const dismiss = useCallback(
        (method: DesktopOnboardingDismissMethod) => {
            sendDesktopOnboardingDismissedEvent({ surface, method });
            finish(method === 'close' ? 'closed' : method);
        },
        [finish, surface]
    );

    const showDownloadingToast = useCallback(() => {
        const id: number = createNotification({
            type: 'info',
            showCloseButton: false,
            text: (
                <>
                    <span>{c('collider_2025: Info').t`Downloading ${LUMO_SHORT_APP_NAME} for desktop…`}</span>
                    <NotificationButton
                        onClick={() => {
                            hideNotification(id);
                        }}
                    >
                        {c('collider_2025: Action').t`Close`}
                    </NotificationButton>
                </>
            ),
        });
    }, [createNotification, hideNotification]);

    const handleDownload = useCallback(async () => {
        finish('download');
        const installerUrl = installerUrlRef.current ? await installerUrlRef.current : undefined;
        if (installerUrl) {
            sendDesktopOnboardingDownloadEvent({ surface, platform: telemetryPlatform, result: 'installer' });
            showDownloadingToast();
            startInstallerDownload(installerUrl);
            return;
        }
        // No installer for this computer (ChromeOS, other Linux) or the release file didn't load.
        sendDesktopOnboardingDownloadEvent({ surface, platform: telemetryPlatform, result: 'download-page' });
        window.open(LUMO_DESKTOP_DOWNLOAD_PAGE, '_blank', 'noopener,noreferrer');
    }, [finish, showDownloadingToast, surface, telemetryPlatform]);

    const contextValue = useMemo(() => {
        return { isDesktopOnboardingBlocking: isBlocking };
    }, [isBlocking]);

    return (
        <DesktopOnboardingContext.Provider value={contextValue}>
            {children}
            {render && (
                <DesktopOnboardingModal
                    {...modalProps}
                    variant={variant}
                    onClose={() => {
                        dismiss('close');
                    }}
                    onDownload={() => {
                        void handleDownload();
                    }}
                    onNotNow={() => {
                        dismiss('not-now');
                    }}
                    onGotIt={() => {
                        dismiss('got-it');
                    }}
                />
            )}
        </DesktopOnboardingContext.Provider>
    );
};
