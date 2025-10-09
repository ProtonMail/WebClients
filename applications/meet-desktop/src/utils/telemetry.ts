import Store from "electron-store";

import { RELEASE_CATEGORIES } from "@proton/shared/lib/constants";

import { getSettings } from "../store/settingsStore";
import { mainLogger } from "../utils/log";
import { URLConfig } from "../store/urlStore";

type ViewID = keyof URLConfig;

// Meet-specific telemetry types
type MeetDailyStatsValues = {
    userLogin: number;
    userLogout: number;
};

type MeetDailyStatsDimensions = {
    releaseCategory: (typeof RELEASE_CATEGORIES)[keyof typeof RELEASE_CATEGORIES];
};

type MeetDailyStatsStored = MeetDailyStatsDimensions &
    MeetDailyStatsValues & {
        lastReport: number;
    };

type MeetDailyStatsReport = {
    dimensions: MeetDailyStatsDimensions;
    values: MeetDailyStatsValues;
};

type TelemetryStored = {
    dailyStats: MeetDailyStatsStored;
};

type DailyStatsUpdate = Partial<MeetDailyStatsStored>;

const NULL_DAILY_COUNTERS: MeetDailyStatsValues = {
    userLogin: 0,
    userLogout: 0,
};

const DEFAULT_TELEMETRY: TelemetryStored = {
    dailyStats: {
        releaseCategory: RELEASE_CATEGORIES.STABLE,
        ...NULL_DAILY_COUNTERS,
        lastReport: 0,
    },
};

type Measurement = keyof TelemetryStored;

class TelemetryService {
    // Reporting stats

    checkDailyStats() {
        this.updateDailyStats((): DailyStatsUpdate => {
            return {
                releaseCategory: getSettings().releaseCategory,
            };
        });
    }

    getDailyStats(): MeetDailyStatsStored {
        return this.loadTelemetry().dailyStats;
    }

    getDailyStatsReport(): MeetDailyStatsReport {
        const stats = this.getDailyStats();
        const dimensions: MeetDailyStatsDimensions = stats;
        const values: MeetDailyStatsValues = stats;

        return {
            dimensions,
            values,
        };
    }

    dailyStatsReported(timestamp: number) {
        this.updateDailyStats((_): DailyStatsUpdate => {
            return {
                ...NULL_DAILY_COUNTERS,
                lastReport: timestamp,
            };
        });
    }

    // Collecting events

    userLogin() {
        this.updateDailyStats((dailyStats): DailyStatsUpdate => {
            return { userLogin: dailyStats.userLogin + 1 };
        });
    }

    userLogout() {
        this.updateDailyStats((dailyStats): DailyStatsUpdate => {
            return { userLogin: dailyStats.userLogin + 1 };
        });
    }

    showView(_viewID: ViewID) {
        // Placeholder for future view tracking
    }

    // Store
    private store = new Store<{ telemetry: TelemetryStored }>();

    private updateStats<M extends Measurement>(
        measurement: M,
        change: (stats: TelemetryStored[M]) => Partial<TelemetryStored[M]>,
    ) {
        const telemetry = this.loadTelemetry();
        const stats = telemetry[measurement];
        const changes = change(stats);
        telemetry[measurement] = { ...stats, ...changes };
        try {
            this.store.set("telemetry", telemetry);
        } catch (e) {
            mainLogger.error(`Failed to update telemetry ${measurement} changes ${changes}:`, e);
        }
    }

    private updateDailyStats(change: (stats: MeetDailyStatsStored) => DailyStatsUpdate) {
        this.updateStats("dailyStats", change);
    }

    private loadTelemetry() {
        try {
            const storedTelemetry = this.store.get("telemetry");
            if (!storedTelemetry) {
                return DEFAULT_TELEMETRY;
            }

            return storedTelemetry;
        } catch (e) {
            mainLogger.error("Failed to load telemetry", e);
        }

        return DEFAULT_TELEMETRY;
    }
}

const telemetry = new TelemetryService();
export default telemetry;
