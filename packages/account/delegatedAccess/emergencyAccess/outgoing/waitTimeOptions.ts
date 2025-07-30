import { c } from 'ttag';

import { DAY } from '@proton/shared/lib/constants';

import { getDaysLabel } from '../helper';

export const getWaitTimeOptions = () => [
    { value: 0, label: c('emergency_access').t`None` },
    { value: 1 * DAY, label: getDaysLabel(1) },
    { value: 2 * DAY, label: getDaysLabel(2) },
    { value: 3 * DAY, label: getDaysLabel(3) },
    { value: 7 * DAY, label: getDaysLabel(7) },
    { value: 14 * DAY, label: getDaysLabel(14) },
    { value: 30 * DAY, label: getDaysLabel(30) },
];
