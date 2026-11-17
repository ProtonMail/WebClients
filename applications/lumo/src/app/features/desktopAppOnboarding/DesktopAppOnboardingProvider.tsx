import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import {
    getDesktopConnectorsApi,
    isDesktopEnvironment,
    openDesktopSettings,
} from '@proton/lumo-api-client/core/desktop-tools';
import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { isTauriOnMac } from '@proton/shared/lib/helpers/desktop';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useDeviceSettings } from '../../providers/DeviceSettingsProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectMasterKeyState } from '../../redux/selectors';
import { useOfferFlags } from '../../upsells/providers/LumoUpsellModalProvider';
import useLumoPlusUpsellButtonConfig from '../../upsells/useLumoPlusUpsellButtonConfig';
import type { DesktopAppOnboardingEndMethod } from '../../util/telemetry';
import {
    sendDesktopAppOnboardingEndedEvent,
    sendDesktopAppOnboardingNotificationsEvent,
    sendDesktopAppOnboardingShownEvent,
    sendDesktopAppOnboardingStepViewedEvent,
} from '../../util/telemetry';
import { getCustomizeSearch } from '../customize/customizeTabs';
import { OnboardingBlockingProvider } from '../desktopOnboarding/DesktopOnboardingProvider';
import { DesktopAppOnboardingModal } from './DesktopAppOnboardingModal';
import type { DesktopAppOnboardingFinal, DesktopAppOnboardingStep } from './desktopAppOnboardingSteps';
import { getDesktopAppOnboardingSteps, needsNotificationStep } from './desktopAppOnboardingSteps';
import type { DesktopAppOnboardingOutcome } from './desktopAppOnboardingStorage';
import {
    hasSeenDesktopAppOnboarding,
    markDesktopAppOnboardingOutcome,
    markDesktopAppOnboardingShown,
} from './desktopAppOnboardingStorage';

/** Same delay as What's new and the web introduction, so the app has settled before the tour opens. */
const OPEN_DELAY_MS = 500;

/** How long to wait for the OS notification permission before opening without the notifications step. */
const PERMISSION_WAIT_MS = 2000;

/**
 * idle: not shown (yet) · waiting: about to open · open: on screen · done: shown in this session.
 */
type Phase = 'idle' | 'waiting' | 'open' | 'done';

interface Tour {
    steps: DesktopAppOnboardingStep[];
    final: DesktopAppOnboardingFinal;
}

const OUTCOME_BY_METHOD: Record<DesktopAppOnboardingEndMethod, DesktopAppOnboardingOutcome> = {
    close: 'closed',
    'start-chatting': 'start-chatting',
    'get-lumo-plus': 'get-lumo-plus',
    'set-up-connector': 'set-up-connector',
};

interface Props {
    children: ReactNode;
}

/**
 * First-launch tour of the desktop app, behind the LumoDesktopAppOnboarding flag. Once per device
 * (local storage). Must sit inside the Router: "Set up a connector" navigates to Customize.
 */
export const DesktopAppOnboardingProvider = ({ children }: Props) => {
    const { desktopAppOnboarding: isFlagEnabled, skills: hasCustomize } = useLumoFlags();
    const isGuest = useIsGuest();
    const isMasterKeyReady = useLumoSelector(selectMasterKeyState).status === 'ready';
    const { isLumoPlanLoading } = useLumoPlan();
    const { loadingOffer } = useOfferFlags();
    // The same config as the sidebar's upgrade button: null when there's nothing to sell (Plus, Business, members).
    const upsellConfig = useLumoPlusUpsellButtonConfig(LUMO_UPSELL_PATHS.DESKTOP_APP_ONBOARDING);
    const {
        notificationSettings: { permission, requestPermission, openSettings },
    } = useDeviceSettings();
    const history = useHistory();

    const [hasSeen] = useState(hasSeenDesktopAppOnboarding);
    const [phase, setPhase] = useState<Phase>('idle');
    const [tour, setTour] = useState<Tour | null>(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [isRequestingNotifications, setIsRequestingNotifications] = useState(false);
    const [isPermissionWaitOver, setIsPermissionWaitOver] = useState(false);
    // Read after awaiting the OS: the user may have gone Back or closed the tour in the meantime.
    const latestRef = useRef({ phase, stepIndex });
    latestRef.current = { phase, stepIndex };

    const { modalProps, openModal, render } = useModalStateObject();

    const isEligible = isFlagEnabled && !isGuest && !hasSeen && isDesktopEnvironment();
    const isBlocking = phase !== 'idle' || isEligible;

    const hasNotificationsApi = typeof window !== 'undefined' && !!window.LumoNotifications;
    const isPermissionSettled = !hasNotificationsApi || permission !== undefined || isPermissionWaitOver;
    const isPlanSettled = !isLumoPlanLoading && !loadingOffer;
    const canUpgrade = !!upsellConfig && (!!upsellConfig.path || !!upsellConfig.onUpgrade);

    useEffect(() => {
        if (!isEligible || isPermissionSettled) {
            return;
        }
        const timer = window.setTimeout(() => {
            setIsPermissionWaitOver(true);
        }, PERMISSION_WAIT_MS);
        return () => {
            window.clearTimeout(timer);
        };
    }, [isEligible, isPermissionSettled]);

    useEffect(() => {
        if (phase === 'idle' && isEligible && isMasterKeyReady && isPlanSettled && isPermissionSettled) {
            setPhase('waiting');
        }
    }, [phase, isEligible, isMasterKeyReady, isPlanSettled, isPermissionSettled]);

    useEffect(() => {
        if (phase !== 'waiting') {
            return;
        }
        const timer = window.setTimeout(() => {
            // Frozen for the whole tour, so granting permission on step 5 doesn't reshuffle the dots.
            const steps = getDesktopAppOnboardingSteps({
                includeNotifications: needsNotificationStep({ hasNotificationsApi, permission }),
            });
            const final: DesktopAppOnboardingFinal = canUpgrade ? 'upsell' : 'connector';
            markDesktopAppOnboardingShown();
            sendDesktopAppOnboardingShownEvent({ finalStep: final, stepCount: steps.length });
            sendDesktopAppOnboardingStepViewedEvent({ step: steps[0] });
            setTour({ steps, final });
            setStepIndex(0);
            setPhase('open');
            openModal(true);
        }, OPEN_DELAY_MS);
        return () => {
            window.clearTimeout(timer);
        };
    }, [phase]);

    const goTo = useCallback(
        (index: number) => {
            if (!tour) {
                return;
            }
            const next = Math.min(Math.max(index, 0), tour.steps.length - 1);
            setStepIndex(next);
            sendDesktopAppOnboardingStepViewedEvent({ step: tour.steps[next] });
        },
        [tour]
    );

    const finish = useCallback(
        (method: DesktopAppOnboardingEndMethod) => {
            if (tour) {
                sendDesktopAppOnboardingEndedEvent({ step: tour.steps[stepIndex], method, finalStep: tour.final });
            }
            markDesktopAppOnboardingOutcome(OUTCOME_BY_METHOD[method]);
            setPhase('done');
            openModal(false);
        },
        [tour, stepIndex, openModal]
    );

    const handleTurnOnNotifications = useCallback(async () => {
        const notificationsIndex = stepIndex;
        // macOS needs a first permission prompt; otherwise (denied, or Windows/Linux) only the OS settings can change it.
        if (permission === 'not_determined' && isTauriOnMac) {
            setIsRequestingNotifications(true);
            const granted = await requestPermission();
            setIsRequestingNotifications(false);
            sendDesktopAppOnboardingNotificationsEvent({ result: granted ? 'granted' : 'not-granted' });
        } else {
            await openSettings();
            sendDesktopAppOnboardingNotificationsEvent({ result: 'opened-settings' });
        }
        // Only move on if the tour is still open on this step (not after Back or ×, e.g. while in System Settings).
        const latest = latestRef.current;
        if (latest.phase !== 'open' || latest.stepIndex !== notificationsIndex) {
            return;
        }
        goTo(notificationsIndex + 1);
    }, [permission, requestPermission, openSettings, goTo, stepIndex]);

    const handleGetLumoPlus = useCallback(() => {
        finish('get-lumo-plus');
        // With a path, the button is a settings link and navigates on its own.
        if (!upsellConfig?.path) {
            upsellConfig?.onUpgrade?.();
        }
    }, [finish, upsellConfig]);

    const handleSetUpConnector = useCallback(async () => {
        finish('set-up-connector');
        // Connectors are set up in the desktop app's own settings, on its Connectors tab.
        if (getDesktopConnectorsApi()?.openSettings) {
            try {
                await openDesktopSettings('connectors');
                return;
            } catch (error) {
                console.warn('Could not open the desktop connector settings', error);
            }
        }
        // Desktop builds without the settings bridge, or if it failed: the in-app Connectors tab.
        if (hasCustomize) {
            history.push({ pathname: '/customize', search: getCustomizeSearch('connectors') });
        }
    }, [finish, hasCustomize, history]);

    return (
        <OnboardingBlockingProvider isBlocking={isBlocking}>
            {children}
            {render && tour && (
                <DesktopAppOnboardingModal
                    {...modalProps}
                    steps={tour.steps}
                    stepIndex={stepIndex}
                    final={tour.final}
                    upgrade={{ path: upsellConfig?.path }}
                    isRequestingNotifications={isRequestingNotifications}
                    onClose={() => {
                        finish('close');
                    }}
                    onNext={() => {
                        goTo(stepIndex + 1);
                    }}
                    onBack={() => {
                        goTo(stepIndex - 1);
                    }}
                    onTurnOnNotifications={() => {
                        void handleTurnOnNotifications();
                    }}
                    onNotificationsNotNow={() => {
                        sendDesktopAppOnboardingNotificationsEvent({ result: 'not-now' });
                        goTo(stepIndex + 1);
                    }}
                    onStartChatting={() => {
                        finish('start-chatting');
                    }}
                    onGetLumoPlus={handleGetLumoPlus}
                    onSetUpConnector={() => {
                        void handleSetUpConnector();
                    }}
                />
            )}
        </OnboardingBlockingProvider>
    );
};
