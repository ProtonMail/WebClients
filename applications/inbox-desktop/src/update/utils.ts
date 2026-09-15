import { RELEASE_CATEGORIES } from "@proton/shared/lib/constants";

const minVersionFetchJitterMs = 900_000; // 15 minutes
const maxVersionFetchJitterMs = 2_700_000; // 45 minutes

const minElectronUpdaterIntervalMinutes = 10;
const maxElectronUpdaterIntervalMinutes = 30;

function getRandomInterval(min: number, max: number) {
    //nosemgrep
    return Math.round(Math.random() * (max - min) + min);
}

export function getVersionManifestFetchJitterMs() {
    return getRandomInterval(minVersionFetchJitterMs, maxVersionFetchJitterMs);
}

export function getElectronUpdaterFetchInterval(): string {
    const interval = getRandomInterval(minElectronUpdaterIntervalMinutes, maxElectronUpdaterIntervalMinutes);
    return `${interval} min`;
}

export function isReleaseCategorySatisfied(local: string, candidate: string) {
    if (local === RELEASE_CATEGORIES.STABLE && candidate === RELEASE_CATEGORIES.STABLE) return true;

    if (local === RELEASE_CATEGORIES.EARLY_ACCESS) {
        if (candidate === RELEASE_CATEGORIES.STABLE || candidate === RELEASE_CATEGORIES.EARLY_ACCESS) return true;
    }

    if (local === RELEASE_CATEGORIES.ALPHA) {
        if (
            candidate === RELEASE_CATEGORIES.STABLE ||
            candidate === RELEASE_CATEGORIES.EARLY_ACCESS ||
            candidate === RELEASE_CATEGORIES.ALPHA
        )
            return true;
    }

    return false;
}
