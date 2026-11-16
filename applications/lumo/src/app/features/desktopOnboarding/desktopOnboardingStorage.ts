import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from '../../util/lumoScopedLocalStorage';

/**
 * Per-device record of the desktop app introduction. Local storage (not Lumo user settings) on
 * purpose: someone who dismisses it on their phone should still see it on their computer.
 */
const DESKTOP_ONBOARDING_KEY = 'lumo-desktop-onboarding';

export type DesktopOnboardingOutcome = 'shown' | 'download' | 'not-now' | 'got-it' | 'closed';

interface DesktopOnboardingRecord {
    shownAt: number;
    outcome: DesktopOnboardingOutcome;
    outcomeAt: number;
}

export const getDesktopOnboardingRecord = (): DesktopOnboardingRecord | null => {
    return readScopedLocalStorageJson<DesktopOnboardingRecord | null>(DESKTOP_ONBOARDING_KEY, null);
};

export const hasSeenDesktopOnboarding = (): boolean => {
    return getDesktopOnboardingRecord() !== null;
};

/** Written as soon as the modal opens, so a reload while it is open doesn't show it again. */
export const markDesktopOnboardingShown = (): void => {
    const now = Date.now();
    writeScopedLocalStorageJson(DESKTOP_ONBOARDING_KEY, { shownAt: now, outcome: 'shown', outcomeAt: now });
};

export const markDesktopOnboardingOutcome = (outcome: DesktopOnboardingOutcome): void => {
    const now = Date.now();
    const shownAt = getDesktopOnboardingRecord()?.shownAt ?? now;
    writeScopedLocalStorageJson(DESKTOP_ONBOARDING_KEY, { shownAt, outcome, outcomeAt: now });
};
