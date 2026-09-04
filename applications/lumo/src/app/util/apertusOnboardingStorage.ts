import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from './lumoScopedLocalStorage';

const APERTUS_ONBOARDING_KEY = 'lumo-apertus-onboarding';

export const getApertusOnboardingAcceptedAt = (): number | undefined => {
    const stored = readScopedLocalStorageJson<{ acceptedAt?: number } | null>(APERTUS_ONBOARDING_KEY, null);
    return typeof stored?.acceptedAt === 'number' ? stored.acceptedAt : undefined;
};

export const markApertusOnboardingAccepted = (acceptedAt = Date.now()): void => {
    writeScopedLocalStorageJson(APERTUS_ONBOARDING_KEY, { acceptedAt });
};
