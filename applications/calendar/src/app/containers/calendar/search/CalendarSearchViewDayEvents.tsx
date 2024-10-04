import type { MouseEvent } from 'react';

import { isSameDay } from 'date-fns';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/components/hooks';
import { getDisplayTitle } from '@proton/shared/lib/calendar/helper';
import { format as formatUTC } from '@proton/shared/lib/date-fns-utc';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { Nullable } from '@proton/shared/lib/interfaces';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import { useCalendarSearch } from './CalendarSearchProvider';
import { getEventTraits } from './CalendarSearchViewDayEvents.utils';
import type { VisualSearchItem } from './interface';
import { getEventsDayDateString, getTimeString } from './searchHelpers';

import './SearchView.scss';

interface Props {
    dailyEvents?: VisualSearchItem[];
    onClickSearchItem?: (e: MouseEvent<HTMLButtonElement>, item: VisualSearchItem) => void;
    closestToDateRef: (element: HTMLDivElement | null) => void;
}

const CalendarSearchViewDayEvents = ({ dailyEvents = [], onClickSearchItem, closestToDateRef }: Props) => {
    const [addresses] = useAddresses();
    const [{ hasPaidMail }] = useUser();

    const now = new Date();
    const startDate = dailyEvents.length ? dailyEvents[0].fakeUTCStartDate : new Date();

    const formattedDate = getEventsDayDateString(startDate);
    const day = formatUTC(startDate, 'd', { locale: dateLocale });

    const isToday = isSameDay(now, startDate);
    // const isPast = isBefore(startDate, now); // might be used again
    const { openedSearchItem } = useCalendarSearch();

    const getColor = (visualCalendar: VisualCalendar, eventColor?: Nullable<string>) => {
        return hasPaidMail && eventColor ? eventColor : visualCalendar.Color;
    };

    return (
        <div
            className="flex flex-nowrap border-bottom border-weak search-result-line w-full px-4 py-2 flex-column lg:flex-row"
            style={{ scrollPaddingTop: '5em' }}
        >
            <div
                data-testid="month-day-block"
                className="flex *:min-size-auto shrink-0 items-baseline search-month-day"
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
                <div className="color-weak min-w-custom" style={{ '--min-w-custom': '9em' }}>
                    {formattedDate}
                </div>
            </div>
            {Boolean(dailyEvents.length) && (
                <div className="grow search-day flex flex-nowrap flex-column pl-7 lg:pl-0 mt-2 lg:mt-0">
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
                            Color,
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
                                    'flex flex-nowrap search-event-cell items-center text-left relative interactive-pseudo w-full color-norm rounded-sm pl-1',
                                    isCancelled && 'text-strike',
                                    isOpen && 'bg-weak'
                                )}
                                onClick={(e) => onClickSearchItem?.(e, event)}
                            >
                                <span
                                    className={clsx(
                                        'search-calendar-border shrink-0 my-1',
                                        isUnanswered && 'isUnanswered'
                                    )}
                                    style={{ '--calendar-color': getColor(visualCalendar, Color) }}
                                />
                                <span
                                    className="flex *:min-size-auto flex-nowrap flex-1 search-event-time-details flex-column lg:flex-row"
                                    ref={isClosestToDate ? closestToDateRef : null}
                                >
                                    <span
                                        className="min-w-custom pl-2 lg:pl-0 pr-2 search-event-time"
                                        style={{ '--min-w-custom': '14em' }}
                                    >
                                        {timeString}
                                    </span>
                                    <span
                                        className={clsx(
                                            'text-ellipsis lg:flex-1 pl-2 lg:pl-0 search-event-summary text-bold'
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
