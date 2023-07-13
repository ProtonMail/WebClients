import { MouseEvent, MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { IllustrationPlaceholder } from '@proton/components/containers';
import { format as formatUTC } from '@proton/shared/lib/date-fns-utc';
import { formatIntlUTCDate } from '@proton/shared/lib/date-utc/formatIntlUTCDate';
import { dateLocale } from '@proton/shared/lib/i18n';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import noResultsImg from '@proton/styles/assets/img/illustrations/empty-search.svg';
import noop from '@proton/utils/noop';

import { OpenedMailEvent } from '../../../hooks/useGetOpenedMailEvents';
import getCalendarEventsCache from '../eventStore/cache/getCalendarEventsCache';
import upsertCalendarApiEventWithoutBlob from '../eventStore/cache/upsertCalendarApiEventWithoutBlobs';
import { CalendarsEventsCache, EventReadResult } from '../eventStore/interface';
import useCalendarsEventsReader from '../eventStore/useCalendarsEventsReader';
import { CalendarViewEvent, InteractiveState } from '../interface';
import { useCalendarSearch } from './CalendarSearchProvider';
import { VisualSearchItem } from './interface';
import {
    expandAndOrderItems,
    getCalendarViewEventWithMetadata,
    getTimeString,
    getVisualSearchItems,
    groupItemsByDay,
} from './searchHelpers';

import './SearchView.scss';

interface Props {
    calendars: VisualCalendar[];
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    tzid: string;
    date: Date;
    setTargetEventRef: (targetEvent: HTMLElement) => void;
    setInteractiveData: (state: InteractiveState) => void;
    getOpenedMailEvents: () => OpenedMailEvent[];
}

const CalendarSearchView = ({
    calendars,
    calendarsEventsCacheRef,
    tzid,
    date,
    setTargetEventRef,
    setInteractiveData,
    getOpenedMailEvents,
}: Props) => {
    const history = useHistory();
    const firstItemRef = useRef<HTMLButtonElement | null>(null);

    const { items, hasSearchedCounter } = useCalendarSearch();
    const [calendarViewEvents, setCalendarViewEvents] = useState<CalendarViewEvent[]>([]);

    const calendarsMap = calendars.reduce<SimpleMap<VisualCalendar>>((acc, calendar) => {
        acc[calendar.ID] = calendar;

        return acc;
    }, {});
    const visualItems = useMemo(() => {
        return getVisualSearchItems({
            items: expandAndOrderItems(items, calendarsEventsCacheRef.current),
            calendarsMap,
            tzid,
            date,
        });
    }, [hasSearchedCounter]);

    const loadPopoverContent = (
        calendarID: string,
        eventID: string,
        {
            calendarViewEvent,
            eventReadResult,
        }: { calendarViewEvent: CalendarViewEvent; eventReadResult: EventReadResult }
    ) => {
        setInteractiveData({
            searchData: {
                ...calendarViewEvent,
                data: {
                    ...calendarViewEvent.data,
                    eventReadResult,
                    eventRecurrence: calendarViewEvent.data.eventRecurrence
                        ? {
                              ...calendarViewEvent.data.eventRecurrence,
                          }
                        : undefined,
                },
            },
        });
    };

    useCalendarsEventsReader({
        calendarEvents: calendarViewEvents,
        calendarsEventsCacheRef,
        rerender: noop,
        getOpenedMailEvents,
        onEventRead: loadPopoverContent,
        forceDecryption: true,
        metadataOnly: false,
    });

    useEffect(() => {
        firstItemRef.current?.scrollIntoView(true);
    }, [history.location]);

    const handleClickSearchItem = (e: MouseEvent<HTMLButtonElement>, item: VisualSearchItem) => {
        const calendarsEventsCache = calendarsEventsCacheRef.current;
        if (!calendarsEventsCache) {
            return;
        }
        const { calendars } = calendarsEventsCache;
        let calendarEventsCache = calendars[item.CalendarID];

        if (!calendarEventsCache) {
            calendarEventsCache = getCalendarEventsCache();
            calendarsEventsCache.calendars[item.CalendarID] = calendarEventsCache;
        }

        /**
         * Upsert event metadata in cache in case it's not there
         *
         * This is a bit of a hack to avoid modifying too much our current structure for reading events.
         * That structure is quite rigid:
         * 1/ First we insert the API calendar event (with or without blob data) in the cache. This is done by
         *    useCalendarsEventFetcher or by the event loop.
         * 2/ Then we decrypt the cached events with useCalendarsEventReader
         * This hack plays the role of step 1 for events that appear in the list of results but were not fetched previously.
         */

        upsertCalendarApiEventWithoutBlob(item, calendarEventsCache);
        const calendarViewEvent = getCalendarViewEventWithMetadata(item);

        setTargetEventRef(e.currentTarget);

        // setting search data opens the popover
        setInteractiveData({
            searchData: calendarViewEvent,
        });

        // trigger event reader
        setCalendarViewEvents([calendarViewEvent]);
    };

    if (!visualItems.length) {
        return (
            <div className="flex flex-column flex-justify-center flex-align-items-center w100 h100">
                <IllustrationPlaceholder title={c('Info message').t`No results found`} url={noResultsImg} />
                <div className="text-center">
                    {c('Info calendar search')
                        .t`You can either update your search query or close search to go back to calendar views`}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-no-min-children flex-column flex-nowrap flex-justify-start flex-align-items-start w100 h100">
            {groupItemsByDay(visualItems).map((dailyItems) => {
                const [{ fakeUTCStartDate }] = dailyItems;
                const formattedMonthYear = formatIntlUTCDate(fakeUTCStartDate, { month: 'short', year: 'numeric' });
                const formattedWeekDay = formatUTC(fakeUTCStartDate, 'ccc');
                const formattedDate = `${formattedWeekDay}, ${formattedMonthYear}`;
                const day = formatUTC(fakeUTCStartDate, 'd', { locale: dateLocale });

                // TODO
                const isToday = false;

                return (
                    <div
                        key={+fakeUTCStartDate}
                        className="flex flex-nowrap border-bottom border-weak search-result-line w100 px-4 py-2 on-tablet-flex-column"
                    >
                        <div
                            className="flex-no-min-children flex-item-noshrink mt-1 pt-0.5"
                            aria-current={isToday ? `date` : undefined}
                        >
                            <div className="text-lg text-semibold min-w3e text-center">
                                <span className="search-day-number rounded-sm py-0.5 px-1">{day}</span>
                            </div>
                            <div className="text-lg text-weak min-w9e">{formattedDate}</div>
                        </div>
                        <div className="flex-items-fluid search-day flex flex-nowrap flex-column pl-7 lg:pl-0 mt-2 lg:mt-0">
                            {dailyItems.map((item) => {
                                const {
                                    ID,
                                    CalendarID,
                                    visualCalendar,
                                    fakeUTCStartDate,
                                    fakeUTCEndDate,
                                    isAllDay,
                                    plusDaysToEnd,
                                    Summary,
                                    isFirst,
                                } = item;
                                const timeString = getTimeString({
                                    startDate: fakeUTCStartDate,
                                    endDate: fakeUTCEndDate,
                                    isAllDay,
                                    plusDaysToEnd,
                                });

                                return (
                                    <button
                                        ref={isFirst ? firstItemRef : null}
                                        type="button"
                                        key={`${CalendarID}-${ID}-${fakeUTCStartDate}`}
                                        className="flex flex-nowrap search-event-cell flex-align-items-center text-left interactive-pseudo w100"
                                        onClick={(e) => handleClickSearchItem(e, item)}
                                    >
                                        <span
                                            className="search-calendar-border flex-item-noshrink my-1"
                                            style={{ '--calendar-color': visualCalendar.Color }}
                                        />
                                        <span className="flex-no-min-children flex-nowrap flex-item-fluid search-event-time-details on-tablet-flex-column">
                                            <span className="text-lg min-w14e pl-2 lg:pl-0 search-event-time">
                                                {timeString}
                                            </span>
                                            <span className="text-lg text-bold text-ellipsis flex-item-fluid pl-2 lg:pl-0 search-event-summary">
                                                {Summary}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CalendarSearchView;
