import { END_TYPE, FREQUENCY, MAX_NOTIFICATIONS } from '@proton/shared/lib/calendar/constants';
import { c } from 'ttag';
import { isBefore } from 'date-fns';

import { EventModel, EventModelErrors } from '@proton/shared/lib/interfaces/calendar';
import { getTimeInUtc } from './time';

// returns array of ids exceeding MAX_NOTIFICATIONS
export const getExcessiveNotificationsIndices = (fields: object[], limit = MAX_NOTIFICATIONS) =>
    fields.map((_, idx) => (idx + 1 > limit ? idx : undefined)).filter((idx): idx is number => idx !== undefined);

const validateEventModel = ({
    start,
    end,
    isAllDay,
    frequencyModel,
    partDayNotifications,
    fullDayNotifications,
}: EventModel) => {
    const errors: EventModelErrors = {};

    const utcStart = getTimeInUtc(start, isAllDay);
    const utcEnd = getTimeInUtc(end, isAllDay);

    if (utcStart > utcEnd) {
        errors.end = c('Error').t`Start time must be before end time`;
    }

    if (frequencyModel.type === FREQUENCY.CUSTOM) {
        if (!frequencyModel.interval) {
            errors.interval = c('Error').t`Interval cannot be empty`;
        }

        if (frequencyModel.ends.type === END_TYPE.UNTIL) {
            if (!frequencyModel.ends.until) {
                errors.until = c('Error').t`Ends on date cannot be empty`;
            }
            if (frequencyModel.ends.until && isBefore(frequencyModel.ends.until, start.date)) {
                errors.until = c('Error').t`Ends on date must be after start time`;
            }
        }

        if (frequencyModel.ends.type === END_TYPE.AFTER_N_TIMES) {
            if (!frequencyModel.ends.count) {
                errors.count = c('Error').t`Number of occurrences cannot be empty`;
            }
        }
    }

    const notifications = isAllDay ? fullDayNotifications : partDayNotifications;
    if (notifications.length > MAX_NOTIFICATIONS) {
        errors.notifications = {
            fields: getExcessiveNotificationsIndices(notifications),
            text: c('Error').t`A maximum of 10 notifications is allowed`,
        };
    }

    return errors;
};

export default validateEventModel;
