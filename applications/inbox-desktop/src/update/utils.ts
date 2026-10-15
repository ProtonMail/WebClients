import { RELEASE_CATEGORIES } from "@proton/shared/lib/constants";

const minVersionFetchJitterMs = 900_000; // 15 minutes
const maxVersionFetchJitterMs = 2_700_000; // 45 minutes

const minElectronUpdaterIntervalMinutes = 10;
const maxElectronUpdaterIntervalMinutes = 30;

/**
 * getRandomInterval returns a random interval between the min and max
 * @param min {number} minimum allowed interval
 * @param max {number} maximum allowed interval
 * @returns {number} a random interval between min and max
 */
function getRandomInterval(min: number, max: number): number {
    //nosemgrep
    return Math.round(Math.random() * (max - min) + min);
}

/**
 * getVersionManifestJitterMS returns a random jitter in MS to fetch the manifest, between 15min and 45min.
 * @returns {number} the manifest version fetch jitter
 */
export function getVersionManifestFetchJitterMs(): number {
    return getRandomInterval(minVersionFetchJitterMs, maxVersionFetchJitterMs);
}

/**
 * getElectronUpdaterFetchInterval returns a random interval to fetch updates between 10 and 30 minutes.
 * @returns {string} the updater fetch interval
 */
export function getElectronUpdaterFetchInterval(): string {
    const interval = getRandomInterval(minElectronUpdaterIntervalMinutes, maxElectronUpdaterIntervalMinutes);
    return `${interval} min`;
}

/**
 *  isReleaseCategorySatisfied checks whether the local release category satisfies the candidates requirements.
 * @param local
 * @param candidate
 * @returns
 */
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
