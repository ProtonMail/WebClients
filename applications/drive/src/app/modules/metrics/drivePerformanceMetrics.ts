import metrics from '@proton/metrics';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { logging } from '../logging';

const logger = logging.getLogger('drivePerformanceMetrics');

const FIRST_PAGE_ITEM_THRESHOLD = 20;

export class DrivePerformanceMetrics {
    private isFirstDataLoad = true;

    /**
     * Latency from navigation start until base shell/bootstrap is ready
     * (excludes Drive list data). Call once after successful bootstrap.
     */
    markPageLoad({ isPublic }: { isPublic: boolean }): void {
        const timeFromNavigationStartMs = performance.now();
        const timeInSeconds = timeFromNavigationStartMs / 1000;
        if (timeInSeconds < 0) {
            return;
        }

        metrics.drive_performance_v2_pageload_histogram.observe({
            Labels: {
                pageType: isPublic ? 'public_page' : 'private_page',
                plaftorm: this.getPlatformLabel(),
            },
            Value: timeInSeconds,
        });
    }

    /**
     * Tracks list load latency. Call when a loading begins and use returned
     * callbacks to report the progress of the load. Do not call it once the
     * data is in memory, but once it is set in state and React will render it.
     */
    startDataLoad(location: string): {
        onItemsLoadedToState: (itemCount: number) => void;
        onFinished: () => void;
    } {
        const startTimeMs = performance.now();

        const plaftorm = this.getPlatformLabel();
        const loadType = this.isFirstDataLoad ? 'first' : 'subsequent';
        this.isFirstDataLoad = false;

        let cumulativeCommittedItems = 0;
        let emittedFirstItem = false;
        let emittedFirstPage = false;
        let emittedFullList = false;

        const measurements: { [key: string]: number } = {};

        const observe = (stage: 'first_item' | 'first_page' | 'full_list') => {
            const timeInSeconds = (performance.now() - startTimeMs) / 1000;
            if (timeInSeconds < 0) {
                return;
            }

            metrics.drive_performance_v2_dataload_histogram.observe({
                Labels: { stage, loadType, plaftorm },
                Value: timeInSeconds,
            });

            measurements[stage] = timeInSeconds;
            if (stage === 'full_list') {
                logger.debug(
                    `Load measurements of ${location} (type ${loadType}, items ${cumulativeCommittedItems}): ${JSON.stringify(measurements)}`
                );
            }
        };

        return {
            onItemsLoadedToState: (itemCount: number) => {
                if (emittedFullList) {
                    return;
                }

                cumulativeCommittedItems += itemCount;

                if (!emittedFirstItem && cumulativeCommittedItems > 0) {
                    emittedFirstItem = true;
                    observe('first_item');
                }
                if (!emittedFirstPage && cumulativeCommittedItems >= FIRST_PAGE_ITEM_THRESHOLD) {
                    emittedFirstPage = true;
                    observe('first_page');
                }
            },
            onFinished: () => {
                if (emittedFullList) {
                    return;
                }
                emittedFullList = true;
                observe('full_list');
            },
        };
    }

    private getPlatformLabel(): 'desktop' | 'mobile' {
        return isMobile() ? 'mobile' : 'desktop';
    }
}
