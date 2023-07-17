import React, { MouseEvent, MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { getYear, isSameYear, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { IllustrationPlaceholder } from '@proton/components/containers';
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
import CalendarSearchViewDayEvents from './CalendarSearchViewDayEvents';
import CalendarSearchViewYearSeparator from './CalendarSearchViewYearSeparator';
import { VisualSearchItem } from './interface';
import {
    expandAndOrderItems,
    fillEmptyToday,
    getCalendarViewEventWithMetadata,
    getVisualSearchItems,
    groupItemsByDay,
} from './searchHelpers';
import { useCalendarSearchPagination } from './useCalendarSearchPagination';

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
    const firstItemRef = useRef<HTMLDivElement | null>(null);

    const { items, hasSearchedCounter, loading } = useCalendarSearch();
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

    // visualItems is sorted by StartTime so we can paginate it directly without sorting it again
    const {
        currentPage,
        items: paginatedItems,
        isNextEnabled,
        isPreviousEnabled,
        next,
        previous,
    } = useCalendarSearchPagination(visualItems);

    useEffect(() => {
        firstItemRef.current?.scrollIntoView(true);
    }, [history.location, currentPage]);

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

    if (loading || !visualItems) {
        return (
            <div className="flex flex-column flex-justify-center flex-align-items-center w100 h100">
                <CircleLoader size="medium" className="color-primary" />
            </div>
        );
    }

    const hasResults = Boolean(visualItems.length);

    const eventsGroupedByDay = groupItemsByDay(paginatedItems);
    const maybeWithEmptyToday = fillEmptyToday(eventsGroupedByDay);

    return (
        <div className="relative flex-no-min-children flex-column flex-nowrap flex-justify-start flex-align-items-start w100 h100">
            <div className="flex flex-row flex-justify-space-between flex-align-items-center w100 py-3 px-5 bg-norm border-bottom">
                <h2 className="h6 text-semibold">
                    {hasResults ? c('esCalendar').t`Results` : c('esCalendar').t`No result`}
                </h2>
                {hasResults && (
                    <div className="flex-row">
                        <Button
                            color="weak"
                            shape="ghost"
                            size="small"
                            className="mx-2"
                            disabled={!isPreviousEnabled}
                            onClick={previous}
                        >
                            {c('Action').t`Previous`}
                        </Button>
                        <Button
                            color="weak"
                            shape="ghost"
                            size="small"
                            className="mx-2"
                            disabled={!isNextEnabled}
                            onClick={next}
                        >
                            {c('Action').t`Next`}
                        </Button>
                    </div>
                )}
            </div>

            {hasResults ? (
                <div className="w100 flex-1 scroll-if-needed">
                    {maybeWithEmptyToday.reduce((acc: React.JSX.Element[], dailyEvents, index) => {
                        const isEmptyDay = !dailyEvents.length;
                        const utcStartDate = isEmptyDay ? startOfDay(new Date()) : dailyEvents[0]?.fakeUTCStartDate;
                        const previousDailyEvents = maybeWithEmptyToday[index - 1];
                        const previousUtStartDate = previousDailyEvents?.[0]?.fakeUTCStartDate ?? new Date();

                        const shouldDisplayYearSeparatorBeforeCurrentDay =
                            !previousDailyEvents || !isSameYear(previousUtStartDate, utcStartDate);

                        const year = getYear(utcStartDate);

                        return [
                            ...acc,
                            ...(shouldDisplayYearSeparatorBeforeCurrentDay
                                ? [<CalendarSearchViewYearSeparator key={`year_${year}`} year={year} />]
                                : []),
                            <CalendarSearchViewDayEvents
                                key={utcStartDate.toString()}
                                dailyEvents={dailyEvents}
                                onClickSearchItem={handleClickSearchItem}
                            />,
                        ];
                    }, [])}
                </div>
            ) : (
                <div className="flex flex-column flex-justify-center flex-align-items-center w100 h100">
                    <IllustrationPlaceholder title={c('Info message').t`No results found`} url={noResultsImg} />
                    <div className="text-center">
                        {c('Info calendar search')
                            .t`You can either update your search query or close search to go back to calendar views`}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarSearchView;
