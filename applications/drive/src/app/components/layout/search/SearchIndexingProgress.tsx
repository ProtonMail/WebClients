import * as React from 'react';

import { c, msgid } from 'ttag';

import { Progress, classnames } from '@proton/components';

import { useSearchLibrary } from '../../../store';
import useSearchState from '../../../store/_search/useSearchState';

import './SearchDropdown.scss';

export const SearchIndexingProgress = () => {
    const { getESDBStatus, getProgressRecorderRef } = useSearchLibrary();
    const { isRefreshing } = getESDBStatus();
    const { esProgress, totalIndexingItems, estimatedMinutes, currentProgressValue } = useSearchState();
    const isEstimating = estimatedMinutes === 0 && (totalIndexingItems === 0 || esProgress !== totalIndexingItems);

    const progressFromBuildEvent = isRefreshing ? 0 : getProgressRecorderRef().current[0];
    const progressValue = isEstimating ? progressFromBuildEvent : currentProgressValue;

    // Progress indicator
    const totalProgressToShow = Math.max(esProgress, getProgressRecorderRef().current[1]);
    let progressStatus: string = '';
    if (isEstimating) {
        progressStatus = c('Info').t`Estimating time remaining...`;
    } else if (isRefreshing) {
        progressStatus = c('Info').t`Updating drive search...`;
    } else {
        // translator: esProgress is a number representing the current message being fetched, totalIndexingItems is the total number of message in the mailbox
        progressStatus = c('Info').jt`Indexing items ${esProgress} out of ${totalProgressToShow}` as string;
    }

    const etaMessage =
        estimatedMinutes <= 1
            ? c('Info').t`Estimated time remaining: Less than a minute`
            : // translator: the variable is a positive integer (written in digits) always strictly bigger than 1
              c('Info').ngettext(
                  msgid`Estimated time remaining: ${estimatedMinutes} minute`,
                  `Estimated time remaining: ${estimatedMinutes} minutes`,
                  estimatedMinutes
              );

    return (
        <div className="mt1-5 flex flex-column">
            <span className="color-weak relative advanced-search-progress-status" aria-live="polite" aria-atomic="true">
                {progressStatus}
            </span>
            <div className="flex flex-justify-space-between">
                <Progress
                    value={progressValue || 0}
                    aria-describedby="timeRemaining"
                    className={classnames(['mt0-5 mb0-5 flex-item-fluid'])}
                />
            </div>
            <span
                id="timeRemaining"
                aria-live="polite"
                aria-atomic="true"
                className={classnames([
                    'color-weak relative advanced-search-time-remaining',
                    isEstimating ? 'visibility-hidden' : undefined,
                ])}
            >
                {etaMessage}
            </span>
        </div>
    );
};
