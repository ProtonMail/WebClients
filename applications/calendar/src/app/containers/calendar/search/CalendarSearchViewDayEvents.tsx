import React, { MouseEvent } from 'react';

import { isSameDay } from 'date-fns';

import { useAddresses } from '@proton/components/hooks';
import { getDisplayTitle } from '@proton/shared/lib/calendar/helper';
import { format as formatUTC } from '@proton/shared/lib/date-fns-utc';
import { dateLocale } from '@proton/shared/lib/i18n';
import clsx from '@proton/utils/clsx';

import { useCalendarSearch } from './CalendarSearchProvider';
import { getEventTraits } from './CalendarSearchViewDayEvents.utils';
import { VisualSearchItem } from './interface';
import { getEventsDayDateString, getTimeString } from './searchHelpers';

import './SearchView.scss';

interface Props {
    dailyEvents?: VisualSearchItem[];
    onClickSearchItem?: (e: MouseEvent<HTMLButtonElement>, item: VisualSearchItem) => void;
    closestToDateRef: (element: HTMLDivElement | null) => void;
}

const CalendarSearchViewDayEvents = ({ dailyEvents = [], onClickSearchItem, closestToDateRef }: Props) => {
    const [addresses] = useAddresses();
    const now = new Date();
    const startDate = dailyEvents.length ? dailyEvents[0].fakeUTCStartDate : new Date();

    const formattedDate = getEventsDayDateString(startDate);
    const day = formatUTC(startDate, 'd', { locale: dateLocale });

    const isToday = isSameDay(now, startDate);
    // const isPast = isBefore(startDate, now); // might be used again
    const { openedSearchItem } = useCalendarSearch();

    return (
        <div
            className="flex flex-nowrap border-bottom border-weak search-result-line w100 px-4 py-2 on-tablet-flex-column"
            style={{ scrollPaddingTop: '5em' }}
        >
            <div
                data-testid="month-day-block"
                className="flex-no-min-children flex-item-noshrink flex-align-items-baseline search-month-day"
                aria-current={isToday ? `date` : undefined}
            >
                <div
                    className="text-lg text-semibold text-center min-w-custom lg:min-w-custom mr-2"
                    style={{
                        '--min-w-custom': '2rem',
                        '--lg-min-w-custom': '5rem',
                    }}
                >
                    <span className="search-day-number rounded-sm p-1 inline-block">{day}</span>
                </div>
                <div className="color-weak min-w9e">{formattedDate}</div>
            </div>
            {Boolean(dailyEvents.length) && (
                <div className="flex-item-grow search-day flex flex-nowrap flex-column pl-7 lg:pl-0 mt-2 lg:mt-0">
                    {dailyEvents.map((event) => {
                        const {
                            UID,
                            ID,
                            CalendarID,
                            visualCalendar,
                            fakeUTCStartDate,
                            fakeUTCEndDate,
                            isAllDay,
                            occurrenceNumber,
                            plusDaysToEnd,
                            Summary,
                            isClosestToDate,
                        } = event;
                        const isOpen =
                            ID === openedSearchItem?.ID &&
                            UID === openedSearchItem?.UID &&
                            CalendarID === openedSearchItem?.CalendarID &&
                            occurrenceNumber === openedSearchItem?.occurrenceNumber;

                        const { isCancelled, isUnanswered } = getEventTraits(event, addresses);

                        const timeString = getTimeString({
                            startDate: fakeUTCStartDate,
                            endDate: fakeUTCEndDate,
                            isAllDay,
                            plusDaysToEnd,
                        });

                        return (
                            <button
                                type="button"
                                key={`${CalendarID}-${ID}-${fakeUTCStartDate}`}
                                className={clsx(
                                    'flex flex-nowrap search-event-cell flex-align-items-center text-left relative interactive-pseudo w100 color-norm rounded-sm pl-1',
                                    isCancelled && 'text-strike',
                                    isOpen && 'bg-weak'
                                )}
                                onClick={(e) => onClickSearchItem?.(e, event)}
                            >
                                <span
                                    className={clsx(
                                        'search-calendar-border flex-item-noshrink my-1',
                                        isUnanswered && 'isUnanswered'
                                    )}
                                    style={{ '--calendar-color': visualCalendar.Color }}
                                />
                                <span
                                    className="flex-no-min-children flex-nowrap flex-item-fluid search-event-time-details on-tablet-flex-column"
                                    ref={isClosestToDate ? closestToDateRef : null}
                                >
                                    <span className="min-w14e pl-2 lg:pl-0 pr-2 search-event-time">{timeString}</span>
                                    <span
                                        className={clsx(
                                            'text-ellipsis flex-item-fluid pl-2 lg:pl-0 search-event-summary text-bold'
                                        )}
                                    >
                                        {getDisplayTitle(Summary)}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CalendarSearchViewDayEvents;
