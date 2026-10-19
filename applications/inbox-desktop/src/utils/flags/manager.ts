import { getMailView } from "../view/viewManagement";
import { FeatureFlag } from "./flags";
import { flagManagerLogger } from "../log";
import { SafeStore } from "../../store/safeStore/safeStore";
import { featureFlagChangeHandlers, FeatureFlagChangeHandlers } from "./changeHandlers";

const cacheFilename = "ff_cache";
const cacheFieldName = "featureFlags";

// Period one minute was decided to reflect quckly the default refresh 10 min
// interval used to retrieve unleash flags from API.
const pollIntervalMS = 60 * 1000;

let featureFlagManager: FeatureFlagManager | null = null;

interface FeatureFlagCache {
    flags: Record<string, boolean>;
    lastUpdated: number;
}

class FeatureFlagManager {
    private flags: Map<FeatureFlag, boolean> = new Map();
    private checkInterval: NodeJS.Timeout | null = null;
    private checkIntervalDurationMS: number = 60 * 1000;
    private store: SafeStore<{ featureFlags: FeatureFlagCache }>;
    private flagChangeHandlers: FeatureFlagChangeHandlers;

    constructor(
        checkIntervalDurationMS: number,
        flagChangeHandlers: FeatureFlagChangeHandlers,
        storeMock?: SafeStore<{ featureFlags: FeatureFlagCache }>,
    ) {
        this.checkIntervalDurationMS = checkIntervalDurationMS;
        this.flagChangeHandlers = flagChangeHandlers;
        this.store =
            storeMock ||
            new SafeStore<{ featureFlags: FeatureFlagCache }>("featureFlag", {
                name: cacheFilename,
                defaults: {
                    featureFlags: {
                        flags: {},
                        lastUpdated: 0,
                    },
                },
            });

        const cachedFlags = this.loadFromCache();
        this.runCachedFlagChangeHandlers(cachedFlags);
        this.startPeriodicCheck();
    }

    public cleanupTest(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    private loadFromCache(): FeatureFlagCache["flags"] {
        const cached = this.store.get(cacheFieldName);

        for (const flag of Object.values(FeatureFlag)) {
            const cachedValue = cached.flags[flag];
            this.flags.set(flag as FeatureFlag, cachedValue ?? false);
        }

        flagManagerLogger.info("Feature flags loaded from cache", {
            lastUpdated: new Date(cached.lastUpdated).toISOString(),
            flags: Object.fromEntries(this.flags),
        });

        return cached.flags;
    }

    private saveToCache(): void {
        const flagsObject: Record<string, boolean> = {};
        for (const [flag, value] of this.flags.entries()) {
            flagsObject[flag] = value;
        }

        this.store.set(cacheFieldName, {
            flags: flagsObject,
            lastUpdated: Date.now(),
        });

        flagManagerLogger.debug("Feature flags saved to cache");
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

        if (!Array.isArray(flags) || flags.length === 0) {
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

    private runCachedFlagChangeHandlers(cachedFlags: FeatureFlagCache["flags"]) {
        for (const [flag, value] of Object.entries(cachedFlags)) {
            this.runFlagChangeHandlers(flag as FeatureFlag, value);
        }
    }

    private runFlagChangeHandlers(flag: FeatureFlag, value: boolean) {
        for (const handler of this.flagChangeHandlers[flag] ?? []) {
            try {
                handler(value);
            } catch (error) {
                flagManagerLogger.error("Flag change handler failure", { flag, error });
            }
        }
    }

    private setFlag(flag: FeatureFlag, value: boolean) {
        if (this.flags.get(flag) === value) {
            return;
        }

        this.flags.set(flag, value);
        this.runFlagChangeHandlers(flag, value);
    }

    isEnabled(flag: FeatureFlag): boolean {
        return this.flags.get(flag) ?? false;
    }
}

export const initializeFeatureFlagManager = () => {
    if (featureFlagManager) return;
    featureFlagManager = new FeatureFlagManager(pollIntervalMS, featureFlagChangeHandlers);
};

export const getFeatureFlagManager = (): FeatureFlagManager => {
    initializeFeatureFlagManager();
    if (!featureFlagManager) {
        throw new Error("Failed to initialize feature flag manager");
    }

    return featureFlagManager;
};

export const initializeFeatureFlagManagerTest = (options?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store?: any;
    pollInterval?: number;
    flagChangeHandlers?: FeatureFlagChangeHandlers;
}) => {
    if (featureFlagManager) return;
    featureFlagManager = new FeatureFlagManager(
        options?.pollInterval ?? pollIntervalMS,
        options?.flagChangeHandlers ?? {},
        options?.store,
    );
};

export const destroyFeatureFlagManagerTest = () => {
    featureFlagManager?.cleanupTest();
    featureFlagManager = null;
};
