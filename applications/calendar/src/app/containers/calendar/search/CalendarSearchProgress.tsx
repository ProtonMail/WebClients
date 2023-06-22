import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Progress } from '@proton/components/components';
import { ESIndexingState } from '@proton/encrypted-search/lib';
import clsx from '@proton/utils/clsx';

const getProgressStatusText = ({
    isEstimating,
    isPaused,
    current,
    total,
}: {
    isEstimating: boolean;
    isPaused: boolean;
    current: number;
    total: number;
}) => {
    if (isPaused) {
        return c('Info').t`Indexing paused`;
    } else if (isEstimating) {
        return c('Info').t`Estimating time remaining...`;
    } else {
        // translator: current is a number representing how many events have been indexed already, total is the total number of events in all user calendars
        return c('Info').t`Indexing events: ${current}/${total}`;
    }
};

interface Props {
    esState: ESIndexingState;
    isPaused: boolean;
}

const CalendarSearchProgress = ({ esState, isPaused }: Props) => {
    const [progressValue, setProgresValue] = useState(0);
    const { estimatedMinutes, totalIndexingItems, esProgress, currentProgressValue } = esState;

    const isEstimating = estimatedMinutes === 0 && (totalIndexingItems === 0 || esProgress !== totalIndexingItems);
    const etaMessage =
        estimatedMinutes <= 1
            ? c('Info').t`Estimated time remaining: Less than a minute`
            : // translator: the variable is a positive integer (written in digits) always strictly bigger than 1
              c('Info').ngettext(
                  msgid`Estimated time remaining: ${estimatedMinutes} minute`,
                  `Estimated time remaining: ${estimatedMinutes} minutes`,
                  estimatedMinutes
              );
    const statusMessage = getProgressStatusText({
        isEstimating,
        isPaused,
        current: esProgress,
        total: totalIndexingItems,
    });

    useEffect(() => {
        // currentProgressValue is set to 0 when indexing is paused
        // but we want the progress bar to keep the real progress value
        if (currentProgressValue >= progressValue) {
            setProgresValue(currentProgressValue);
        }
    }, [currentProgressValue]);

    return (
        <div className="mt-6 flex flex-column">
            <span className="color-weak relative advanced-search-progress-status" aria-live="polite" aria-atomic="true">
                {statusMessage}
            </span>
            <div className="flex flex-justify-space-between">
                <Progress
                    value={progressValue}
                    aria-describedby="timeRemaining"
                    className={clsx(['my-2 flex-item-fluid', isPaused ? 'progress-bar--disabled' : undefined])}
                />
            </div>
            <span
                id="timeRemaining"
                aria-live="polite"
                aria-atomic="true"
                className={clsx([
                    'color-weak relative advanced-search-time-remaining',
                    isEstimating ? 'visibility-hidden' : undefined,
                ])}
            >
                {etaMessage}
            </span>
        </div>
    );
};

export default CalendarSearchProgress;
