import { WebContents } from "electron";
import { webRequestRouter } from "../../electronSession/webRequestRouter";
import { stuckLoaderWatchLogger as logger } from "../../log";
import { getWebContentsViewName, getViewURL, openMailToDefaultAndForceReload } from "../viewManagement";
import { sentryReport } from "../../sentryReport";
import { getFeatureFlagManager } from "../../flags/manager";
import { FeatureFlag } from "../../flags/flags";

const LOADER_CHECK_DELAY_MS = 6_000;
const NETWORK_OBSERVATION_MS = 6_000;
const LOADER_SELECTOR = "[data-proton-loader]";

type Cleanup = () => void;
const activeTrackers = new Map<number, Cleanup>();

const isKillSwitchOn = (): boolean => {
    return getFeatureFlagManager().isEnabled(FeatureFlag.LOADER_STUCK_STATE_RECOVERY_DISABLED);
};

async function hasLoaderInContents(contents: WebContents): Promise<boolean> {
    try {
        return await contents.executeJavaScript(`!!document.querySelector(${JSON.stringify(LOADER_SELECTOR)})`);
    } catch (e) {
        logger.error("hasLoaderInContents failed", e);
        return false;
    }
}

function cleanup(webContentsId: number) {
    activeTrackers.get(webContentsId)?.();
    activeTrackers.delete(webContentsId);
}

/**
 * Tracks the provided webContent. If the Proton-loader is visible after LOADER_CHECK_DELAY_MS, we initiate
 * another timeout executing after NETWORK_OBSERVATION_MS. If no network activity is registered, and the loader is still visible
 * we display the mail view, and force a reload to the base mail view URL. Otherwise we simply teardown the content tracking.
 */
export async function watchForStuckLoader(contents: WebContents, isCurrentContent: () => boolean) {
    if (isKillSwitchOn()) return;

    if (!(await hasLoaderInContents(contents))) {
        return;
    }

    const id = contents.id;
    cleanup(id);

    let loaderCheckTimer: NodeJS.Timeout | null = null;
    let observationTimer: NodeJS.Timeout | null = null;
    let unsubscribes: (() => void)[] = [];
    let tornDown = false;

    const teardown = () => {
        if (tornDown) return;

        logger.info(`tearing down observer for id: ${id}`);
        tornDown = true;

        if (loaderCheckTimer) clearTimeout(loaderCheckTimer);
        if (observationTimer) clearTimeout(observationTimer);

        unsubscribes.forEach((unsub) => unsub());
        unsubscribes = [];
        activeTrackers.delete(id);
    };

    activeTrackers.set(id, teardown);

    loaderCheckTimer = setTimeout(async () => {
        loaderCheckTimer = null;

        if (!isCurrentContent() || contents.isDestroyed() || tornDown) {
            teardown();
            return;
        }

        if (!(await hasLoaderInContents(contents)) || tornDown) {
            teardown();
            return;
        }

        logger.info("loader still visible after 6s, observing network for id", id);

        let hadActivity = false;

        const onActivity = (details: { webContentsId?: number; url: string }) => {
            if (details.webContentsId !== id || !details.url.startsWith("https://")) {
                return;
            }

            hadActivity = true;
            logger.info(`had network activity, terminating for id ${id} ${details.url}`);
            teardown();
        };

        unsubscribes.push(
            webRequestRouter.onBeforeRequest(onActivity),
            webRequestRouter.onCompleted(onActivity),
            webRequestRouter.onErrorOccurred(onActivity),
        );

        observationTimer = setTimeout(async () => {
            if (tornDown) return;
            observationTimer = null;

            if (
                contents.isDestroyed() ||
                !(await hasLoaderInContents(contents)) ||
                !isCurrentContent() ||
                hadActivity ||
                tornDown
            ) {
                teardown();
                return;
            }

            const viewName = getWebContentsViewName(contents);
            const stuckURL = viewName ? getViewURL(viewName) : "unknown";
            logger.warn("stuck loader detected, recovering to mail view", stuckURL);

            sentryReport.reportMessage("stuck loader recovery triggered", {
                level: "warning",
                tags: { view: viewName ?? "unknown" },
                extras: { url: stuckURL },
            });

            teardown();
            void openMailToDefaultAndForceReload();
        }, NETWORK_OBSERVATION_MS);
    }, LOADER_CHECK_DELAY_MS);
}

export function cancelStuckLoaderWatch(webContentsId: number) {
    cleanup(webContentsId);
}
