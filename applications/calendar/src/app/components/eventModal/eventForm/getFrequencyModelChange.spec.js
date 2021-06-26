import { END_TYPE, FREQUENCY } from 'proton-shared/lib/calendar/constants';
import getFrequencyModelChange from './getFrequencyModelChange';

const frequencyModel = {
    type: FREQUENCY.CUSTOM,
    frequency: FREQUENCY.DAILY,
    interval: 1,
    daily: {
        type: 0,
    },
    weekly: {
        type: 0,
        days: [4],
    },
    monthly: {
        type: 0,
    },
    yearly: {
        type: 0,
    },
    ends: {
        type: END_TYPE.UNTIL,
        count: 2,
        until: new Date('2020-07-16T00:00:00.000Z'),
    },
};

describe('Form update', () => {
    it('should update end date if new start date is in the future', () => {
        const newDate = new Date('2020-09-09T11:30:00.000Z');
        const { ends } = getFrequencyModelChange(
            {
                date: new Date('2020-05-16T00:00:00.000Z'),
            },
            {
                date: newDate,
            },
            frequencyModel
        );
        expect(+ends.until).toBe(+newDate);
    });
});
