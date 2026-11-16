import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from '../../util/lumoScopedLocalStorage';

/**
 * Per-device record of the desktop app tour. Local storage on purpose: a new computer is a fresh
 * setup, so the tour shows again there.
 */
const DESKTOP_APP_ONBOARDING_KEY = 'lumo-desktop-app-onboarding';

export type DesktopAppOnboardingOutcome = 'shown' | 'closed' | 'start-chatting' | 'get-lumo-plus' | 'set-up-connector';

interface DesktopAppOnboardingRecord {
    shownAt: number;
    outcome: DesktopAppOnboardingOutcome;
    outcomeAt: number;
}

export const getDesktopAppOnboardingRecord = (): DesktopAppOnboardingRecord | null => {
    return readScopedLocalStorageJson<DesktopAppOnboardingRecord | null>(DESKTOP_APP_ONBOARDING_KEY, null);
};

export const hasSeenDesktopAppOnboarding = (): boolean => {
    return getDesktopAppOnboardingRecord() !== null;
};

/** Written as soon as the tour opens, so a reload while it is open doesn't start it again. */
export const markDesktopAppOnboardingShown = (): void => {
    const now = Date.now();
    writeScopedLocalStorageJson(DESKTOP_APP_ONBOARDING_KEY, { shownAt: now, outcome: 'shown', outcomeAt: now });
};

export const markDesktopAppOnboardingOutcome = (outcome: DesktopAppOnboardingOutcome): void => {
    const now = Date.now();
    const shownAt = getDesktopAppOnboardingRecord()?.shownAt ?? now;
    writeScopedLocalStorageJson(DESKTOP_APP_ONBOARDING_KEY, { shownAt, outcome, outcomeAt: now });
};
