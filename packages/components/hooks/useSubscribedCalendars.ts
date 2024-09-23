import { useEffect, useMemo, useState } from 'react';

import { useLoading } from '@proton/hooks';
import { getSubscriptionParameters } from '@proton/shared/lib/api/calendars';
import { getIsSubscribedCalendar, getVisualCalendars } from '@proton/shared/lib/calendar/calendar';
import { getIsCalendarSubscriptionEventManagerUpdate } from '@proton/shared/lib/calendar/subscribe/helpers';
import {
    findMemberIndices,
    getIsCalendarEventManagerCreate,
    getIsCalendarEventManagerDelete,
    getIsCalendarEventManagerUpdate,
    getIsCalendarMemberEventManagerCreate,
    getIsCalendarMemberEventManagerDelete,
    getIsCalendarMemberEventManagerUpdate,
} from '@proton/shared/lib/eventManager/calendar/helpers';
import type {
    Calendar,
    CalendarMember,
    CalendarSubscription,
    CalendarSubscriptionResponse,
    CalendarWithOwnMembers,
    SubscribedCalendar,
    VisualCalendar,
} from '@proton/shared/lib/interfaces/calendar';
import type {
    CalendarEventManager,
    CalendarMemberEventManager,
    CalendarSubscriptionEventManager,
} from '@proton/shared/lib/interfaces/calendar/EventManager';
import addItem from '@proton/utils/addItem';
import removeItem from '@proton/utils/removeIndex';
import updateItem from '@proton/utils/updateItem';

import { useCalendarModelEventManager } from '../containers/eventManager/calendar/CalendarModelEventManagerProvider';
import useApi from './useApi';
import useEventManager from './useEventManager';

const useSubscribedCalendars = (calendars: VisualCalendar[], loadingCalendars = false) => {
    const [subscribedCalendars, setSubscribedCalendars] = useState<SubscribedCalendar[]>([]);
    const [loading, withLoading] = useLoading(true);
    const api = useApi();

    const calendarIDs = useMemo(() => calendars.map(({ ID }) => ID), [calendars]);

    const { subscribe: coreSubscribe } = useEventManager();
    const { subscribe: calendarSubscribe } = useCalendarModelEventManager();

    const handleAddCalendar = async (calendar: CalendarWithOwnMembers) => {
        if (!getIsSubscribedCalendar(calendar)) {
            return;
        }
        const { CalendarSubscription } = await api<CalendarSubscriptionResponse>(
            getSubscriptionParameters(calendar.ID)
        );

        setSubscribedCalendars((prevState = []) =>
            getVisualCalendars([
                ...prevState,
                {
                    ...calendar,
                    SubscriptionParameters: CalendarSubscription,
                },
            ])
        );
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

    const handleDeleteMember = (memberID: string) => {
        setSubscribedCalendars((subscribedCalendars) => {
            const [calendarIndex, memberIndex] = findMemberIndices(memberID, subscribedCalendars);
            if (calendarIndex === -1 || memberIndex === -1) {
                return subscribedCalendars;
            }
            const oldCalendar = subscribedCalendars[calendarIndex];

            return updateItem(subscribedCalendars, calendarIndex, {
                ...oldCalendar,
                Members: removeItem(oldCalendar.Members, memberIndex),
            });
        });
    };

    const handleCreateMember = (member: CalendarMember) => {
        setSubscribedCalendars((subscribedCalendars) => {
            const { ID: memberID, CalendarID } = member;
            const [calendarIndex, memberIndex] = findMemberIndices(memberID, subscribedCalendars, CalendarID);
            if (calendarIndex === -1 || memberIndex !== -1) {
                return subscribedCalendars;
            }
            const oldCalendar = subscribedCalendars[calendarIndex];

            return updateItem(subscribedCalendars, calendarIndex, {
                ...oldCalendar,
                Members: addItem(oldCalendar.Members, member),
            });
        });
    };

    const handleUpdateMember = (member: CalendarMember) => {
        setSubscribedCalendars((subscribedCalendars) => {
            const { ID: memberID, CalendarID } = member;
            const [calendarIndex, memberIndex] = findMemberIndices(memberID, subscribedCalendars, CalendarID);
            if (calendarIndex === -1 || memberIndex === -1) {
                return subscribedCalendars;
            }
            const oldCalendar = subscribedCalendars[calendarIndex];

            return getVisualCalendars(
                updateItem(subscribedCalendars, calendarIndex, {
                    ...oldCalendar,
                    Members: updateItem(oldCalendar.Members, memberIndex, member),
                })
            );
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
        if (loadingCalendars) {
            return;
        }

        return coreSubscribe(
            ({
                Calendars: CalendarEvents = [],
                CalendarMembers: CalendarMembersEvents = [],
            }: {
                Calendars?: CalendarEventManager[];
                CalendarMembers?: CalendarMemberEventManager[];
            }) => {
                CalendarEvents.forEach((event) => {
                    if (getIsCalendarEventManagerDelete(event)) {
                        handleDeleteCalendar(event.ID);
                    }

                    if (getIsCalendarEventManagerCreate(event)) {
                        // TODO: The code below is prone to race conditions. Namely if a new event manager update
                        //  comes before this promise is resolved.
                        void handleAddCalendar(event.Calendar);
                    }

                    if (getIsCalendarEventManagerUpdate(event)) {
                        // TODO: The code below is prone to race conditions. Namely if a new event manager update
                        //  comes before this promise is resolved.
                        void handleUpdateCalendar(event.Calendar);
                    }
                });

                CalendarMembersEvents.forEach((event) => {
                    if (getIsCalendarMemberEventManagerDelete(event)) {
                        handleDeleteMember(event.ID);
                    } else if (getIsCalendarMemberEventManagerCreate(event)) {
                        handleCreateMember(event.Member);
                    } else if (getIsCalendarMemberEventManagerUpdate(event)) {
                        handleUpdateMember(event.Member);
                    }
                });
            }
        );
    }, [loadingCalendars]);

    useEffect(() => {
        if (loadingCalendars) {
            return;
        }

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
    }, [calendarIDs, loadingCalendars]);

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

        if (loadingCalendars) {
            return;
        }

        void withLoading(run());
    }, [loadingCalendars]);

    return { subscribedCalendars, loading };
};

export default useSubscribedCalendars;
