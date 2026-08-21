import type { VcalCalendarComponent } from '@proton/shared/lib/interfaces/calendar';

import { captureMessage } from '../helpers/sentry';
import {
    getTriggerValue,
    isValidTriggerDuration,
    pruneOrganizer,
    reformatDateTimes,
    reformatLineBreaks,
    reformatVcalEnclosing,
    replaceTrigger,
} from './icsSurgery/ics';
import { parse } from './vcalParse';

/**
 * Same as the parse function, but trying to recover performing ICS surgery directly on the vcal string
 */
export const parseWithRecovery = (
    vcal: string,
    retry: {
        retryLineBreaks?: boolean;
        retryEnclosing?: boolean;
        retryDateTimes?: boolean;
        retryOrganizer?: boolean;
        retryDuration?: boolean;
    } = {
        retryLineBreaks: true,
        retryEnclosing: true,
        retryDateTimes: true,
        retryOrganizer: true,
        retryDuration: true,
    },
    reportToSentryData?: { calendarID: string; eventID: string }
): VcalCalendarComponent => {
    const { retryLineBreaks, retryEnclosing, retryDateTimes, retryOrganizer, retryDuration } = retry;
    try {
        return parse(vcal);
    } catch (e: any) {
        const reportIfNeeded = (text: string, errorMessage: string) => {
            if (reportToSentryData) {
                captureMessage(text, {
                    level: 'info',
                    extra: {
                        ...reportToSentryData,
                        errorMessage,
                    },
                });
            }
        };
        const message = e.message.toLowerCase();
        // try to recover from line break errors
        const couldBeLineBreakError =
            message.includes('missing parameter value') || message.includes('invalid line (no token ";" or ":")');
        if (couldBeLineBreakError && retryLineBreaks) {
            reportIfNeeded('Unparseable event due to bad folding', message);
            const reformattedVcal = reformatLineBreaks(vcal);
            return parseWithRecovery(reformattedVcal, { ...retry, retryLineBreaks: false });
        }
        // try to recover from enclosing errors
        if (message.includes('invalid ical body') && retryEnclosing) {
            reportIfNeeded('Unparseable event due to enclosing errors', message);
            const reformattedVcal = reformatVcalEnclosing(vcal);
            return parseWithRecovery(reformattedVcal, { ...retry, retryEnclosing: false });
        }
        // try to recover from datetimes error
        const couldBeDateTimeError =
            message.includes('invalid date-time value') || message.includes('could not extract integer from');
        if (couldBeDateTimeError && retryDateTimes) {
            reportIfNeeded('Unparseable event due to badly formatted datetime', message);
            const reformattedVcal = reformatDateTimes(vcal);
            return parseWithRecovery(reformattedVcal, { ...retry, retryDateTimes: false });
        }

        // try to recover from organizer error
        const couldBeOrganizerError = message.includes("missing parameter value in 'organizer");
        if (couldBeOrganizerError && retryOrganizer) {
            reportIfNeeded('Unparseable event due badly formatted organizer', message);
            const reformattedVcal = pruneOrganizer(vcal);
            return parseWithRecovery(reformattedVcal, { ...retry, retryOrganizer: false });
        }

        const triggerValue = getTriggerValue(vcal);
        const couldBeDurationError = triggerValue && !isValidTriggerDuration(triggerValue);
        if (couldBeDurationError && retryDuration) {
            reportIfNeeded('Unparseable event due to badly formatted alarm trigger value', message);
            const reformattedVcal = replaceTrigger(vcal);
            return parseWithRecovery(reformattedVcal, { ...retry, retryDuration: false });
        }

        throw e;
    }
};

/**
 * Helper needed to parse events in our own DB due to other clients saving events with bad folding
 */
export const parseWithFoldingRecovery = (
    vcal: string,
    reportToSentryData?: { calendarID: string; eventID: string }
) => {
    return parseWithRecovery(vcal, { retryLineBreaks: true }, reportToSentryData);
};
