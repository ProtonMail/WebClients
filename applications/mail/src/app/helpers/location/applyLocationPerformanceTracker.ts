import { MINUTE } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { SentryMailPerformanceInitiatives, spanToJSON, startInactiveSpan } from '@proton/shared/lib/helpers/sentry';
import type { Span } from '@proton/shared/lib/helpers/sentry';

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

class ApplyLocationPerformanceTracker {
    private spans: Map<string, Span> = new Map();

    getSpanName(elementID: string) {
        return `APPLY_LOCATION_${elementID}`;
    }

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

            const spanName = this.getSpanName(elementID);
            const span = startInactiveSpan(spanName, SentryMailPerformanceInitiatives.APPLY_LOCATION_PERFORMANCE, {
                destinationLabelID: getLabelID(destinationLabelID),
                isDesktopApp: isElectronApp.toString(),
                isCategoryViewEnabled: isCategoryViewEnabled.toString(),
                sourceLabelID: getLabelID(sourceLabelID),
                type: actionType,
            });

            if (span) {
                this.spans.set(spanName, span);
            }
        });

        queueMicrotask(() => this.cleanup());
    }

    measure(elementID: string): void {
        const spanName = this.getSpanName(elementID);
        const span = this.spans.get(spanName);

        if (span) {
            span.end();
            this.spans.delete(spanName);
        }
    }

    private cleanup() {
        const now = Date.now();
        // Periodically clear marks created when applying an optimistic action that is not moving the message from the list.
        // E.g., Removing a custom label will not move the item out from the list, except if the current label is the custom label
        this.spans.forEach((span, name) => {
            // @ts-expect-error - spanToJSON is not typed correctly
            const spanData = spanToJSON(span);

            if (spanData.start_timestamp !== undefined) {
                if (now - spanData.start_timestamp * 1000 > MINUTE) {
                    span.setStatus('deadline_exceeded');
                    span.end();
                    this.spans.delete(name);
                }
            }
        });
    }
}

let applyLocationTracker: ApplyLocationPerformanceTracker;

export const getApplyLocationTracker = () => {
    if (!applyLocationTracker) {
        applyLocationTracker = new ApplyLocationPerformanceTracker();
    }

    return applyLocationTracker;
};
