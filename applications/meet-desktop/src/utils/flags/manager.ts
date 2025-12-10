import { getMeetView } from "../view/viewManagement";
import Store from "electron-store";
import { FeatureFlag } from "./flags";
import { isValidFlagString } from "./isValidFlagString";

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
    private store: Store<{ featureFlags: FeatureFlagCache }>;
    private initialCheckSucceeded: boolean = false;

    constructor(checkIntervalDurationMS: number, storeMock?: Store<{ featureFlags: FeatureFlagCache }>) {
        this.checkIntervalDurationMS = checkIntervalDurationMS;
        this.store =
            storeMock ||
            new Store<{ featureFlags: FeatureFlagCache }>({
                name: cacheFilename,
                defaults: {
                    featureFlags: {
                        flags: {},
                        lastUpdated: 0,
                    },
                },
            });

        this.loadFromCache();
        this.startPeriodicCheck();
    }

    public cleanupTest(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    private loadFromCache(): void {
        const cached = this.store.get(cacheFieldName);

        for (const flag of Object.values(FeatureFlag)) {
            const cachedValue = cached.flags[flag];
            this.flags.set(flag as FeatureFlag, cachedValue ?? false);
        }
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
    }

    private checkFlags(): void {
        const view = getMeetView();
        if (!view || !view.webContents) {
            return;
        }

        view.webContents
            .executeJavaScript('localStorage.getItem("unleash:repository:repo");', true)
            .then((result: unknown) => {
                this.updateFlags(result);
                if (!this.initialCheckSucceeded) {
                    this.initialCheckSucceeded = true;
                    // Switch to normal polling interval after first successful check
                    this.restartWithNormalInterval();
                }
            })
            .catch(() => {});
    }

    private updateFlags(flags: unknown) {
        if (!flags || flags === null) {
            return;
        }

        try {
            if (typeof flags === "string") {
                // Validate string length to prevent DoS attacks
                if (flags.length === 0 || flags.length > 100000) {
                    return;
                }

                // Validate string to prevent prototype pollution attacks
                if (!isValidFlagString(flags)) {
                    return;
                }

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
        // Start with fast retries (every 5s) until first successful check
        this.checkFlags();
        this.checkInterval = setInterval(() => this.checkFlags(), 5000);
    }

    private restartWithNormalInterval() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        this.checkInterval = setInterval(() => this.checkFlags(), this.checkIntervalDurationMS);
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
