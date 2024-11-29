import Store from "electron-store";

import { RELEASE_CATEGORIES } from "@proton/shared/lib/constants";
import {
    DailyStatsStored,
    DailyStatsReport,
    DailyStatsValues,
    DailyStatsDimensions,
} from "@proton/shared/lib/desktop/DailyStats";
import { IsDefaultProtocolReport, IsDefaultProtocolChangedReport } from "@proton/shared/lib/desktop/DefaultProtocol";

import { getSettings } from "../store/settingsStore";
import { mainLogger } from "../utils/log";
import { checkDefaultMailto, getDefaultMailto } from "../utils/protocol/default";

type TelemetryStored = {
    dailyStats: DailyStatsStored;
};

type DailyStatsUpdate = Partial<DailyStatsStored>;

const NULL_DAILY_COUNTERS: DailyStatsValues = {
    mailtoClicks: 0,
    switchViewMailToCalendar: 0,
    switchViewCalendarToMail: 0,
    userLogin: 0,
    userLogout: 0,
};

const DEFAULT_TELEMETRY: TelemetryStored = {
    dailyStats: {
        releaseCategory: RELEASE_CATEGORIES.STABLE,
        isDefaultMailto: "unknown",
        isDefaultMailtoChanged: "no_change",
        ...NULL_DAILY_COUNTERS,
        lastReport: 0,
    },
};

type Measurement = keyof TelemetryStored;

class TelemetryService {
    // Reporting stats

    checkDailyStats() {
        checkDefaultMailto();
        const defaultMailto = getDefaultMailto();

        this.updateDailyStats((lastStats): DailyStatsUpdate => {
            let isDefaultMailto: IsDefaultProtocolReport = "unknown";
            let isDefaultMailtoChanged: IsDefaultProtocolChangedReport = "no_change";

            if (defaultMailto.wasChecked) {
                isDefaultMailto = defaultMailto.isDefault ? "true" : "false";

                if (lastStats.isDefaultMailto === "true" && isDefaultMailto === "false") {
                    isDefaultMailtoChanged = "yes_to_no";
                }

                if (lastStats.isDefaultMailto === "false" && isDefaultMailto === "true") {
                    isDefaultMailtoChanged = "no_to_yes";
                }
            }

            return {
                releaseCategory: getSettings().releaseCategory,
                isDefaultMailto,
                isDefaultMailtoChanged,
            };
        });
    }

    getDailyStats(): DailyStatsStored {
        return this.loadTelemetry().dailyStats;
    }

    getDailyStatsReport(): DailyStatsReport {
        const stats = this.getDailyStats();
        const dimensions: DailyStatsDimensions = stats;
        const values: DailyStatsValues = stats;

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

    private updateDailyStats(change: (stats: DailyStatsStored) => DailyStatsUpdate) {
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
