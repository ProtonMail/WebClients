import { modelToGeneralProperties } from './modelToProperties';
import { c } from 'ttag';
import { getTimeInUtc } from './time';
import { END_TYPE } from '../../../constants';
import { isBefore } from 'date-fns';
import { EventModel, EventModelErrors } from '../../../interfaces/EventModel';

const validateEventModel = ({ start, end, isAllDay, title, frequencyModel }: EventModel) => {
    const errors: EventModelErrors = {};

    const generalProperties = modelToGeneralProperties({ title });

    if (!generalProperties.summary?.value) {
        errors.title = c('Error').t`Title required`;
    }

    const utcStart = getTimeInUtc(start, isAllDay);
    const utcEnd = getTimeInUtc(end, isAllDay);

    if (utcStart > utcEnd) {
        errors.end = c('Error').t`Start time must be before end time`;
    }

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

    return errors;
};

export default validateEventModel;
