import { getSubscriptionParameters } from '@proton/shared/lib/api/calendars';
import {
    getIsCalendarSubscriptionEventManagerUpdate,
    getIsSubscribedCalendar,
} from '@proton/shared/lib/calendar/subscribe/helpers';
import {
    getIsCalendarEventManagerCreate,
    getIsCalendarEventManagerDelete,
    getIsCalendarEventManagerUpdate,
} from '@proton/shared/lib/eventManager/helpers';
import { useEffect, useMemo, useState } from 'react';
import {
    CalendarEventManager,
    CalendarSubscriptionEventManager,
} from '@proton/shared/lib/interfaces/calendar/EventManager';
import { removeItem, updateItem } from '@proton/shared/lib/helpers/array';
import {
    Calendar,
    CalendarSubscription,
    CalendarSubscriptionResponse,
    SubscribedCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import useApi from './useApi';
import useLoading from './useLoading';
import useEventManager from './useEventManager';
import { useCalendarModelEventManager } from '../containers/eventManager/calendar/ModelEventManagerProvider';

const useSubscribedCalendars = (calendars: Calendar[]) => {
    const [subscribedCalendars, setSubscribedCalendars] = useState<SubscribedCalendar[]>([]);
    const [loading, withLoading] = useLoading(true);
    const api = useApi();

    const calendarIDs = useMemo(() => calendars.map(({ ID }) => ID), [calendars]);

    const { subscribe: standardSubscribe } = useEventManager();
    const { subscribe: calendarSubscribe } = useCalendarModelEventManager();

    const handleAddCalendar = async (calendar: Calendar) => {
        if (!getIsSubscribedCalendar(calendar)) {
            return;
        }
        const { CalendarSubscription } = await api<CalendarSubscriptionResponse>(
            getSubscriptionParameters(calendar.ID)
        );

        setSubscribedCalendars((prevState = []) => [
            ...prevState,
            {
                ...calendar,
                SubscriptionParameters: CalendarSubscription,
            },
        ]);
    };

    const handleDeleteCalendar = (calendarID: string) => {
        setSubscribedCalendars((subscribedCalendars) => {
            const index = subscribedCalendars?.findIndex((calendar) => calendar.ID === calendarID);
            return removeItem(subscribedCalendars, index);
        });
    };

    const handleUpdateCalendar = (calendar: Calendar) => {
        setSubscribedCalendars((subscribedCalendars) => {
            const { ID } = calendar;
            const index = subscribedCalendars?.findIndex((calendar) => calendar.ID === ID);
            return updateItem(subscribedCalendars, index, {
                ...subscribedCalendars[index],
                ...calendar,
            });
        });
    };

    const handleUpdateSubscription = (calendarID: string, subscription: CalendarSubscription) => {
        setSubscribedCalendars((subscribedCalendars) => {
            const index = subscribedCalendars?.findIndex((calendar) => calendar.ID === calendarID);
            const oldCalendar = subscribedCalendars[index];
            return updateItem(subscribedCalendars, index, {
                ...oldCalendar,
                SubscriptionParameters: {
                    ...oldCalendar.SubscriptionParameters,
                    ...subscription,
                },
            });
        });
    };

    useEffect(() => {
        return standardSubscribe(({ Calendars = [] }: { Calendars?: CalendarEventManager[] }) => {
            Calendars.forEach((calendarChange) => {
                if (getIsCalendarEventManagerDelete(calendarChange)) {
                    handleDeleteCalendar(calendarChange.ID);
                }

                if (getIsCalendarEventManagerCreate(calendarChange)) {
                    void handleAddCalendar(calendarChange.Calendar);
                }

                if (getIsCalendarEventManagerUpdate(calendarChange)) {
                    void handleUpdateCalendar(calendarChange.Calendar);
                }
            });
        });
    }, []);

    useEffect(() => {
        return calendarSubscribe(
            calendarIDs,
            ({
                CalendarSubscriptions: CalendarSubscriptionEvents = [],
            }: {
                CalendarSubscriptions?: CalendarSubscriptionEventManager[];
            }) => {
                CalendarSubscriptionEvents.forEach((calendarSubscriptionChange) => {
                    if (getIsCalendarSubscriptionEventManagerUpdate(calendarSubscriptionChange)) {
                        const { ID, CalendarSubscription } = calendarSubscriptionChange;
                        handleUpdateSubscription(ID, CalendarSubscription);
                    }
                });
            }
        );
    }, [calendarIDs]);

    useEffect(() => {
        const run = async () => {
            const newSubscribedCalendars = await Promise.all(
                calendars.map(async (calendar) => {
                    const { CalendarSubscription } = await api<CalendarSubscriptionResponse>(
                        getSubscriptionParameters(calendar.ID)
                    );

                    return {
                        ...calendar,
                        SubscriptionParameters: CalendarSubscription,
                    };
                })
            );

            void setSubscribedCalendars(newSubscribedCalendars);
        };

        withLoading(run());
    }, []);

    return { subscribedCalendars, loading };
};

export default useSubscribedCalendars;
