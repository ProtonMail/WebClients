import { parse } from '@proton/shared/lib/calendar/vcal';
import { PROPERTIES } from '@proton/shared/lib/calendar/vcalDefinition';
import { VcalCalendarComponent } from '@proton/shared/lib/interfaces/calendar';

/**
 * If a vcalendar ics does not have the proper enclosing, add it
 */
export const reformatVcalEnclosing = (vcal = '') => {
    let sanitized = vcal;
    if (!sanitized.startsWith('BEGIN:VCALENDAR')) {
        sanitized = `BEGIN:VCALENDAR\r\n${sanitized}`;
    }
    if (!sanitized.endsWith('END:VCALENDAR')) {
        sanitized = `${sanitized}\r\nEND:VCALENDAR`;
    }
    return sanitized;
};

/**
 * Naively extract lines in a vcalendar string
 */
const getNaiveLines = (vcal = '', separator = '\r\n') => {
    const separatedLines = vcal.split(separator);
    if (separator === '\n') {
        return separatedLines;
    }
    // split possible remaining line breaks
    return separatedLines.flatMap((line) => line.split('\n'));
};

/**
 * Extract naively the vcal field in a vcal line
 */
const getNaiveField = (line: string) => {
    const splitByParamsLine = line.split(';');
    if (splitByParamsLine.length > 1) {
        return splitByParamsLine[0];
    }
    const splitByValue = line.split(':');
    if (splitByValue.length > 1) {
        return splitByValue[0];
    }
    return '';
};

/**
 * Unfold lines assuming they were folded properly
 */
export const unfoldLines = (vcal = '', separator = '\r\n') => {
    const separatedLines = vcal.split(separator);

    return separatedLines.reduce((acc, line) => {
        if (line.startsWith(' ')) {
            return `${acc}${line.slice(1)}`;
        }
        return acc ? `${acc}${separator}${line}` : line;
    }, '');
};

/**
 * Naively try to reformat badly formatted line breaks in a vcalendar string
 */
export const reformatLineBreaks = (vcal = '') => {
    // try to guess the line separator of the ics (some providers use '\n' instead of the RFC-compliant '\r\n')
    const separator = vcal.includes('\r\n') ? '\r\n' : '\n';
    const lines = getNaiveLines(vcal, separator);
    return lines.reduce((acc, line) => {
        const field = getNaiveField(line);
        if (!field) {
            // if not a field line, it should be folded
            return `${acc}${separator} ${line}`;
        }
        // make sure we did not get a false positive for the field line
        const lowerCaseField = field.toLowerCase();
        if (
            PROPERTIES.has(lowerCaseField) ||
            lowerCaseField.startsWith('x-') ||
            ['begin', 'end'].includes(lowerCaseField)
        ) {
            // field lines should not be folded
            return acc ? `${acc}${separator}${line}` : line;
        }
        // fall back to folding
        return `${acc}${separator} ${line}`;
    }, '');
};

/**
 * Fix errors in the formatting of date-times:
 * * Add missing VALUE=DATE for date values
 * * Complete with zeroes incomplete date-times
 * * Trim spaces
 * * Transforms ISO formatting and removes milliseconds
 * * Remove duplicate Zulu markers
 */
export const reformatDateTimes = (vcal = '') => {
    const separator = vcal.includes('\r\n') ? '\r\n' : '\n';
    const unfoldedVcal = unfoldLines(vcal, separator);
    const unfoldedLines = unfoldedVcal.split(separator);

    return unfoldedLines
        .map((line) => {
            const field = getNaiveField(line).trim().toLowerCase();

            if (['dtstart', 'dtend', 'dtstamp', 'last-modified', 'created', 'recurrence-id'].includes(field)) {
                // In case the line matches the ISO standard, we replace it by the ICS standard
                const standardizedLine = line.replace(
                    /(\d\d\d\d)-(\d\d)-(\d\d)[Tt](\d\d):(\d\d):(\d\d).*?([Zz]*$)/,
                    `$1$2$3T$4$5$6$7`
                );
                const parts = standardizedLine
                    .split(':')
                    // trim possible spaces in the parts
                    .map((part) => part.trim());
                const totalParts = parts.length;

                if (totalParts === 2 && /^\d{8}$/.test(parts[1])) {
                    // it's a date value
                    return `${parts[0]};VALUE=DATE:${parts[1]}`;
                }

                return parts
                    .map((part, i) => {
                        if (i < totalParts - 1) {
                            return part;
                        } else {
                            // naively the value will be here
                            const match = part.match(/[Zz]+$/);
                            const endingZs = match ? match[0].length : 0;
                            const isUTC = !!endingZs;
                            const dateTime = isUTC ? part.slice(0, -endingZs) : part;
                            const [date = '', time = ''] = dateTime.split(/[Tt]/);
                            if (date.length !== 8) {
                                // we cannot recover; we do no surgery and an error will be thrown
                                return part;
                            }
                            if (time.length < 6) {
                                const completeDateTime = `${date}T${time.padEnd(6, '0')}`;

                                return isUTC ? `${completeDateTime}Z` : completeDateTime;
                            }
                            if (time.length > 6) {
                                const reducedDateTime = `${date}T${time.slice(0, 6)}`;

                                return isUTC ? `${reducedDateTime}Z` : reducedDateTime;
                            }
                            return isUTC ? `${date}T${time}Z` : `${date}T${time}`;
                        }
                    })
                    .join(':');
            } else {
                return line;
            }
        })
        .join(separator);
};

/**
 * Same as the parse function, but trying to recover performing ICS surgery directly on the vcal string
 */
export const parseWithRecovery = (
    vcal: string,
    retry = { retryLineBreaks: true, retryEnclosing: true, retryDateTimes: true }
): VcalCalendarComponent => {
    const { retryLineBreaks, retryEnclosing, retryDateTimes } = retry;
    try {
        return parse(vcal);
    } catch (e: any) {
        const message = e.message.toLowerCase();
        // try to recover from line break errors
        const couldBeLineBreakError =
            message.includes('missing parameter value') || message.includes('invalid line (no token ";" or ":")');
        if (couldBeLineBreakError && retryLineBreaks) {
            const reformattedVcal = reformatLineBreaks(vcal);
            return parseWithRecovery(reformattedVcal, { ...retry, retryLineBreaks: false });
        }
        // try to recover from enclosing errors
        if (message.includes('invalid ical body') && retryEnclosing) {
            const reformattedVcal = reformatVcalEnclosing(vcal);
            return parseWithRecovery(reformattedVcal, { ...retry, retryEnclosing: false });
        }
        // try to recover from
        const couldBeDateTimeError =
            message.includes('invalid date-time value') || message.includes('could not extract integer from');
        if (couldBeDateTimeError && retryDateTimes) {
            const reformattedVcal = reformatDateTimes(vcal);
            return parseWithRecovery(reformattedVcal, { ...retry, retryDateTimes: false });
        }
        throw e;
    }
};
