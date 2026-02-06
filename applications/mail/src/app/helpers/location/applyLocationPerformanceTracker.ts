import { MINUTE } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { SentryMailPerformanceInitiatives, captureMessage } from '@proton/shared/lib/helpers/sentry';

import { isElementMessage } from 'proton-mail/helpers/elements';
import { getLabelID } from 'proton-mail/metrics/mailMetricsHelper';
import type { Element } from 'proton-mail/models/element';

export interface ApplyLocationMarkDetail {
    sourceLabelID: string;
    destinationLabelID: string;
    type: string;
    isDesktopApp: boolean;
    isCategoryViewEnabled: boolean;
}

export const APPLY_LABEL_MARK_PREFIX = 'apply-label-start-';

class ApplyLocationPerformanceTracker {
    mark({
        elements,
        actionType,
        sourceLabelID,
        destinationLabelID,
        conversationMode,
        isCategoryViewEnabled,
    }: {
        elements: Element[];
        actionType: string;
        sourceLabelID: string;
        destinationLabelID: string;
        conversationMode: boolean;
        isCategoryViewEnabled: boolean;
    }) {
        elements.forEach((element) => {
            // When moving a message from a conversation thread, the conversation should move out from the list
            let elementID = element.ID;
            if (isElementMessage(element) && conversationMode) {
                elementID = element.ConversationID;
            }

            // Clear potential existing marks to prevent having a false time
            performance.clearMarks(`${APPLY_LABEL_MARK_PREFIX}${elementID}`);
            performance.mark(`${APPLY_LABEL_MARK_PREFIX}${elementID}`, {
                detail: {
                    // Anonymize custom label and folders name
                    sourceLabelID: getLabelID(sourceLabelID),
                    destinationLabelID: getLabelID(destinationLabelID),
                    type: actionType,
                    isDesktopApp: isElectronApp.toString(),
                    isCategoryViewEnabled: isCategoryViewEnabled.toString(),
                },
            });
        });

        queueMicrotask(() => this.cleanup());
    }

    measure(elementID: string): { duration: number; detail: ApplyLocationMarkDetail } | null {
        const markName = `${APPLY_LABEL_MARK_PREFIX}${elementID}`;
        const marks = performance.getEntriesByName(markName);

        if (marks.length === 0) {
            return null;
        }

        const mark = marks[0] as PerformanceMark & { detail: ApplyLocationMarkDetail };
        const duration = performance.now() - mark.startTime;

        captureMessage('Apply location performance', {
            tags: {
                initiative: SentryMailPerformanceInitiatives.APPLY_LOCATION_PERFORMANCE,
            },
            extra: {
                ...mark.detail,
                durationMs: Math.ceil(duration),
            },
        });

        performance.clearMarks(markName);

        return { duration, detail: mark.detail };
    }

    private cleanup() {
        // Periodically clear marks created when applying an optimistic action that is not moving the message from the list.
        // E.g., Removing a custom label will not move the item out from the list, except if the current label is the custom label
        performance
            .getEntriesByType('mark')
            // Clean items which at least went through one event loop update
            .filter((m) => m.name.startsWith(APPLY_LABEL_MARK_PREFIX) && performance.now() - m.startTime > MINUTE)
            .forEach((m) => performance.clearMarks(m.name));
    }
}

let applyLocationTracker: ApplyLocationPerformanceTracker;

export const getApplyLocationTracker = () => {
    if (!applyLocationTracker) {
        applyLocationTracker = new ApplyLocationPerformanceTracker();
    }

    return applyLocationTracker;
};
