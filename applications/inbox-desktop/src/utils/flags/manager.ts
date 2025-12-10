import { getMailView } from "../view/viewManagement";
import { FeatureFlag } from "./flags";
import { flagManagerLogger } from "../log";

// Period one minute was decided to reflect quckly the default refresh 10 min
// interval used to retrieve unleash flags from API.
const pollIntervalMS = 60 * 1000;

let featureFlagManager: FeatureFlagManager | null = null;

class FeatureFlagManager {
    private flags: Map<FeatureFlag, boolean> = new Map();
    private checkInterval: NodeJS.Timeout | null = null;
    private checkIntervalDurationMS: number = 60 * 1000;

    constructor(checkIntervalDurationMS: number) {
        this.checkIntervalDurationMS = checkIntervalDurationMS;

        this.startPeriodicCheck();
    }

    public cleanupTest(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    private checkFlags(): void {
        flagManagerLogger.debug("Checking flags");

        const view = getMailView();
        if (!view || !view.webContents) {
            flagManagerLogger.warn("Cannot check flags: mail view unavailable");
            return;
        }

        view.webContents
            .executeJavaScript('localStorage.getItem("unleash:repository:repo");', true)
            .then((result: unknown) => {
                this.updateFlags(result);
            })
            .catch((error: Error) => {
                flagManagerLogger.error("Failed to retrieve feature flags from localStorage", {
                    error: error.message,
                });
            });
    }

    private updateFlags(flags: unknown) {
        if (!flags || flags === null) {
            return;
        }

        try {
            if (typeof flags === "string") {
                flags = JSON.parse(flags);
            }
        } catch (_) {
            return;
        }

        if (!Array.isArray(flags)) {
            return;
        }

        const foundFlags = new Set<string>();

        for (const flag of flags) {
            if (typeof flag !== "object" || !("name" in flag) || !("enabled" in flag)) {
                continue;
            }

            for (const trackedFlag of Object.values(FeatureFlag)) {
                if (flag["name"] === trackedFlag) {
                    foundFlags.add(flag["name"]);
                    this.setFlag(trackedFlag as FeatureFlag, flag["enabled"] === true);
                    // We found this flag. Stop the current iteration.
                    break;
                }
            }
        }

        // Reset the feature flags that we did not find.
        for (const trackedFlag of Object.values(FeatureFlag)) {
            if (!foundFlags.has(trackedFlag)) {
                this.setFlag(trackedFlag as FeatureFlag, false);
            }
        }

        this.saveToCache();
    }

    private startPeriodicCheck() {
        this.checkFlags(); // Check flags from remote on initialization.
        this.checkInterval = setInterval(() => this.checkFlags(), this.checkIntervalDurationMS);

        const intervalMS = this.checkIntervalDurationMS;
        flagManagerLogger.info("Feature flag periodic check started", { intervalMS });
    }

    private setFlag(flag: FeatureFlag, value: boolean) {
        this.flags.set(flag, value);
    }

    isEnabled(flag: FeatureFlag): boolean {
        return this.flags.get(flag) ?? false;
    }
}

export const initializeFeatureFlagManager = () => {
    if (featureFlagManager) return;
    featureFlagManager = new FeatureFlagManager(pollIntervalMS);
};

export const getFeatureFlagManager = (): FeatureFlagManager => {
    initializeFeatureFlagManager();
    if (!featureFlagManager) {
        throw new Error("Failed to initialize feature flag manager");
    }

    return featureFlagManager;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const initializeFeatureFlagManagerTest = (options?: { store?: any; pollInterval?: number }) => {
    if (featureFlagManager) return;
    featureFlagManager = new FeatureFlagManager(options?.pollInterval ?? pollIntervalMS, options?.store);
};

export const destroyFeatureFlagManagerTest = () => {
    featureFlagManager?.cleanupTest();
    featureFlagManager = null;
};
