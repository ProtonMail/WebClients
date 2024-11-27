import { fromLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';

export const convertTupleFromLocalToUtc = (dateRange: [Date, Date]) =>
    dateRange.map((date) => toUTCDate(fromLocalDate(date))) as [Date, Date];
