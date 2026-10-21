import { useCallback, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useNotifications } from '@proton/app-context/useNotifications';
import { changeCalendarVisiblity } from '@proton/calendar/calendars/actions';
import { calendarUrlQueryParams } from '@proton/calendar/constants';
import { getQueryParamsStatus } from '@proton/calendar/utils';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { CalendarBootstrap, VisualCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';

import { useCalendarDispatch } from '../../store/hooks';
import type { CalendarEventsCache } from './eventStore/interface';

export interface UseCalendarActionsOnLoadParameters {
    create: () => void;
    update: (eventId: string, calendarId: string) => Promise<void>;
    openBookingCreationSidebar: () => void;
    dependencies: {
        cachedCalendars: {
            [key: string]: CalendarEventsCache | undefined;
        };
        isEventCreationDisabled: boolean;
        createEventCalendar?: VisualCalendar;
        createEventCalendarBootstrap?: CalendarBootstrap;
        activeAddresses: Address[];
        hasInteractiveData: boolean;
        canCreateBooking: boolean;
        isWelcomeFlowDone: boolean;
    };
}

export const useCalendarActionsOnLoad = ({
    create,
    update,
    openBookingCreationSidebar,
    dependencies: {
        cachedCalendars,
        isEventCreationDisabled,
        createEventCalendar,
        createEventCalendarBootstrap,
        activeAddresses,
        canCreateBooking,
        isWelcomeFlowDone,
    },
}: UseCalendarActionsOnLoadParameters) => {
    const dispatch = useCalendarDispatch();

    const notifications = useNotifications();

    const history = useHistory();
    const location = useLocation();

    // These are used to prevent the actions from being triggered multiple times
    const eventFormOpened = useRef(false);
    const startedEventEdit = useRef(false);
    const calendarVisibilityChanged = useRef(false);
    const bookingSidebarOpened = useRef(false);

    const handleActions = useCallback(async () => {
        const searchParams = new URLSearchParams(location.search);

        const { isCreateMode, isEditMode, isCreateBookingMode, calendarIdFromQueryParams, eventId } =
            getQueryParamsStatus(location.search);

        const calendarID = calendarIdFromQueryParams ?? (createEventCalendar?.ID as string);

        if (
            isEditMode &&
            calendarIdFromQueryParams &&
            !cachedCalendars?.[calendarID] &&
            !calendarVisibilityChanged.current
        ) {
            calendarVisibilityChanged.current = true;

            void dispatch(changeCalendarVisiblity({ calendarID, display: true }));

            return;
        }

        if (isEditMode && calendarVisibilityChanged.current && !cachedCalendars?.[calendarID]) {
            notifications.createNotification({
                type: 'error',
                text: 'The calendar has been removed',
            });

            return;
        }

        if (
            isEditMode &&
            eventId &&
            createEventCalendar &&
            !startedEventEdit.current &&
            cachedCalendars?.[calendarID]
        ) {
            startedEventEdit.current = true;

            searchParams.delete(calendarUrlQueryParams.eventId);
            searchParams.delete(calendarUrlQueryParams.action);
            searchParams.delete(calendarUrlQueryParams.calendarId);

            history.replace({
                ...location,
                search: searchParams.toString() ? `?${searchParams.toString()}` : '',
            });

            void update(eventId, calendarID);
        }

        if (
            isCreateMode &&
            !isEventCreationDisabled &&
            createEventCalendar &&
            createEventCalendarBootstrap &&
            activeAddresses.length > 0 &&
            !eventFormOpened.current
        ) {
            eventFormOpened.current = true;

            create();

            // Cleanup so the query params don't have the create action anymore
            searchParams.delete(calendarUrlQueryParams.action);

            history.replace({
                ...location,
                search: searchParams.toString() ? `?${searchParams.toString()}` : '',
            });
        }

        // Waits for the welcome flow so the booking sidebar doesn't open underneath Calendar's onboarding modal
        if (isCreateBookingMode && canCreateBooking && isWelcomeFlowDone && !bookingSidebarOpened.current) {
            bookingSidebarOpened.current = true;

            openBookingCreationSidebar();

            searchParams.delete(calendarUrlQueryParams.action);

            history.replace({
                ...location,
                search: searchParams.toString() ? `?${searchParams.toString()}` : '',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-D3D194
    }, [
        createEventCalendar,
        createEventCalendarBootstrap,
        activeAddresses.length,
        canCreateBooking,
        isWelcomeFlowDone,
        history,
        location,
    ]);

    useEffect(() => {
        void handleActions();
    }, [handleActions]);
};
