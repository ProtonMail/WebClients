import { DAY } from '@proton/shared/lib/constants';

import { getDaysLabel } from '../../helper';

const defaultDays = 7;

export const getDefaultWaitTimeOptionValue = () => {
    return defaultDays * DAY;
};

export const getWaitTimeOptions = () =>
    [1, 2, 3, defaultDays, 14, 30].map((value) => ({ value: value * DAY, label: getDaysLabel(value) }));
