import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { ESCalendarMetadata } from '../../../interfaces/encryptedSearch';

export type VisualSearchItem = ESCalendarMetadata & {
    visualCalendar: VisualCalendar;
    isAllDay: boolean;
    plusDaysToEnd: number;
    fakeUTCStartDate: Date;
    fakeUTCEndDate: Date;
    occurrenceNumber?: number;
    localStart?: Date;
    localEnd?: Date;
    isSingleOccurrence?: boolean;
    isClosestToDate?: boolean;
};

export interface SearchModel {
    keyword: string;
    startDate?: Date;
    endDate?: Date;
}
