import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getUnixTime } from 'date-fns';
import { c } from 'ttag';

import { ButtonLike, Href } from '@proton/atoms';
import { useGetCalendars } from '@proton/calendar/calendars/hooks';
import {
    AppLink,
    Banner,
    CalendarEventDateHeader,
    Icon,
    IconRow,
    useAddresses,
    useApi,
    useContactEmails,
    useGetAddressKeys,
    useGetAddresses,
    useGetCalendarEventRaw,
    useNotifications,
} from '@proton/components';
import { BannerBackgroundColor } from '@proton/components/components/banner/Banner';
import { useLinkHandler } from '@proton/components/hooks/useLinkHandler';
import useIsMounted from '@proton/hooks/useIsMounted';
import { getEvent } from '@proton/shared/lib/api/calendars';
import { getPaginatedEventsByUID } from '@proton/shared/lib/calendar/api';
import {
    getCalendarWithReactivatedKeys,
    getDoesCalendarNeedUserAction,
    getVisualCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { getSelfAddressData } from '@proton/shared/lib/calendar/deserialize';
import { getDisplayTitle } from '@proton/shared/lib/calendar/helper';
import { getParticipant } from '@proton/shared/lib/calendar/mailIntegration/invite';
import { getOccurrencesBetween } from '@proton/shared/lib/calendar/recurrence/recurring';
import { escapeInvalidHtmlTags, restrictedCalendarSanitize } from '@proton/shared/lib/calendar/sanitize';
import urlify from '@proton/shared/lib/calendar/urlify';
import { getIsEventCancelled } from '@proton/shared/lib/calendar/veventHelper';
import { APPS, CALENDAR_APP_NAME, SECOND } from '@proton/shared/lib/constants';
import { toUTCDate } from '@proton/shared/lib/date/timezone';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { CalendarEvent, VcalVeventComponent, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getParsedHeadersFirstValue } from '@proton/shared/lib/mail/messages';

import { useContactsMap } from 'proton-mail/hooks/contact/useContacts';
import useMailModel from 'proton-mail/hooks/useMailModel';

import { getEventLocalStartEndDates } from '../../../../helpers/calendar/emailReminder';
import { getParticipantsList } from '../../../../helpers/calendar/invite';
import type { MessageErrors } from '../../../../store/messages/messagesTypes';
import EmailReminderWidgetSkeleton from './EmailReminderWidgetSkeleton';
import EventReminderBanner from './EventReminderBanner';
import ExtraEventParticipants from './ExtraEventParticipants';
import OpenInCalendarButton from './OpenInCalendarButton';
import useCalendarWidgetDrawerEvents from './useCalendarWidgetDrawerEvents';

import './CalendarWidget.scss';

const EVENT_NOT_FOUND_ERROR = 'EVENT_NOT_FOUND';
const DECRYPTION_ERROR = 'DECRYPTION_ERROR';

interface EmailReminderWidgetProps {
    message: Pick<Message, 'ID' | 'ParsedHeaders'>;
    errors?: MessageErrors;
}

const EmailReminderWidget = ({ message, errors }: EmailReminderWidgetProps) => {
    const mailSettings = useMailModel('MailSettings');
    const eventReminderRef = useRef<HTMLDivElement>(null);

    const calendarIdHeader = getParsedHeadersFirstValue(message, 'X-Pm-Calendar-Calendarid');
    const eventIdHeader = getParsedHeadersFirstValue(message, 'X-Pm-Calendar-Eventid');
    const occurrenceHeader = getParsedHeadersFirstValue(message, 'X-Pm-Calendar-Occurrence');
    const sequenceHeader = getParsedHeadersFirstValue(message, 'X-Pm-Calendar-Sequence');
    const eventUIDHeader = getParsedHeadersFirstValue(message, 'X-Pm-Calendar-Eventuid');
    const eventIsRecurringHeader = getParsedHeadersFirstValue(message, 'X-Pm-Calendar-Eventisrecurring');
    const recurrenceIdHeader = getParsedHeadersFirstValue(message, 'X-Pm-Calendar-Recurrenceid');

    const [vevent, setVevent] = useState<VcalVeventComponent>();
    const [calendar, setCalendar] = useState<VisualCalendar>();
    const [addresses] = useAddresses();
    const getAddresses = useGetAddresses();
    const [calendarEvent, setCalendarEvent] = useState<CalendarEvent>();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<React.ReactNode>(null);
    const [loadedWidget, setLoadedWidget] = useState<string>();
    const [refreshCount, setRefreshCount] = useState<number>(0);

    const { createNotification } = useNotifications();
    const api = useApi();
    const contactsMap = useContactsMap();
    const getCalendarEventRaw = useGetCalendarEventRaw(contactsMap);
    const contactEmails = useContactEmails()[0] || [];
    const getCalendars = useGetCalendars();
    const getAddressKeys = useGetAddressKeys();

    const isMounted = useIsMounted();
    // setters don't need to be listed as dependencies in a callback
    const refresh = useCallback(() => {
        if (isMounted()) {
            setLoadedWidget('');
            setRefreshCount((count) => count + 1);
        }
    }, []);

    const messageHasDecryptionError = !!errors?.decryption?.length;

    const { modal: linkModal } = useLinkHandler(eventReminderRef, mailSettings);

    useCalendarWidgetDrawerEvents({
        messageID: message.ID,
        calendarEvent,
        refresh,
    });

    useEffect(() => {
        void (async () => {
            if (
                !calendarIdHeader ||
                !eventIdHeader ||
                !occurrenceHeader ||
                !sequenceHeader ||
                messageHasDecryptionError
            ) {
                // widget should not be displayed under these circumstances
                // clear up React states in case this component does not unmount when opening new emails
                setError(null);
                setLoadedWidget('');
                return;
            }
            if (loadedWidget === message.ID) {
                return;
            }
            let calendarData;

            try {
                setError(null);
                setIsLoading(true);

                const occurrence = parseInt(`${occurrenceHeader}`, 10);

                const fetchEvent = async (
                    byUID = eventIsRecurringHeader === '1'
                ): Promise<{ Event: CalendarEvent }> => {
                    // We need to fall back to UID search for
                    // - recurring events, to detect deleted and modified occurrences
                    // - when the calendar is changed, since the other route relies on the calendar id
                    if (byUID) {
                        const allEventsByUID = await getPaginatedEventsByUID({
                            api,
                            uid: `${eventUIDHeader}`,
                            recurrenceID: recurrenceIdHeader ? parseInt(recurrenceIdHeader, 10) : undefined,
                        });

                        if (!allEventsByUID.length) {
                            throw new Error(EVENT_NOT_FOUND_ERROR);
                        }

                        const sameCalendarEvents = allEventsByUID.filter(
                            ({ CalendarID }) => CalendarID === calendarIdHeader
                        );
                        const events = sameCalendarEvents.length ? sameCalendarEvents : allEventsByUID;

                        if (events.find(({ Exdates }) => Exdates.includes(occurrence))) {
                            throw new Error(EVENT_NOT_FOUND_ERROR);
                        }

                        const currentEvent = events.find(({ RecurrenceID }) => RecurrenceID === occurrence);

                        if (currentEvent) {
                            return { Event: currentEvent };
                        }

                        const baseEvent = events.filter(({ RecurrenceID }) => !RecurrenceID)[0];

                        if (baseEvent) {
                            return { Event: baseEvent };
                        }

                        return { Event: events[0] };
                    }

                    return api<{ Event: CalendarEvent }>({
                        ...getEvent(calendarIdHeader, eventIdHeader),
                        silence: true,
                    }).catch(() => {
                        return fetchEvent(true);
                    });
                };

                const [{ Event }, calendarsWithMembers = []] = await Promise.all([fetchEvent(), getCalendars()]);
                const calendars = getVisualCalendars(calendarsWithMembers);

                const calendar = calendars.find(({ ID }) => ID === Event.CalendarID);

                const addresses = await getAddresses();
                // We cannot be sure that setCalendar has finished when reaching the catch
                calendarData = calendar
                    ? await getCalendarWithReactivatedKeys({ calendar, api, addresses, getAddressKeys })
                    : calendar;

                if (!isMounted()) {
                    return;
                }

                setCalendar(calendarData);

                const { veventComponent } = await getCalendarEventRaw(Event).catch(() => {
                    throw new Error(DECRYPTION_ERROR);
                });

                if (!isMounted()) {
                    return;
                }

                const { until, count } = veventComponent.rrule?.value || {};

                const jsOccurrence = occurrence * SECOND;

                const isUntilExpired = until ? occurrence > getUnixTime(toUTCDate(until)) : false;
                const isCountExpired =
                    count !== undefined
                        ? !getOccurrencesBetween(veventComponent, jsOccurrence, jsOccurrence).length
                        : false;

                if (isUntilExpired || isCountExpired) {
                    throw new Error(EVENT_NOT_FOUND_ERROR);
                }

                setCalendarEvent(Event);
                setVevent(veventComponent);
            } catch (error: any) {
                if (!(error instanceof Error)) {
                    createNotification({ type: 'error', text: 'Unknown error' });
                }

                if (!isMounted()) {
                    return;
                }

                if (calendarData && error.message === DECRYPTION_ERROR) {
                    const shouldShowAction = getDoesCalendarNeedUserAction(calendarData);

                    if (shouldShowAction) {
                        const learnMoreLink = (
                            <Href
                                href={getKnowledgeBaseUrl('/restoring-encrypted-calendar')}
                                className="link align-baseline"
                                key="learn-more"
                            >
                                {c('Action').t`Learn more`}
                            </Href>
                        );

                        setError(
                            <Banner
                                icon="key"
                                action={
                                    <ButtonLike
                                        as={AppLink}
                                        toApp={APPS.PROTONCALENDAR}
                                        to="/"
                                        color="norm"
                                        className="shrink-0"
                                    >
                                        <div className="flex items-center">
                                            <span className="mr-3">{c('Action').t`Open ${CALENDAR_APP_NAME}`}</span>
                                            <Icon name="arrow-out-square" />
                                        </div>
                                    </ButtonLike>
                                }
                            >
                                {c('Email reminder decryption error')
                                    .jt`Event details are encrypted. Sign in again to restore Calendar and decrypt your data. ${learnMoreLink}`}
                            </Banner>
                        );

                        return;
                    }

                    const whyNotLink = (
                        <Href href={getKnowledgeBaseUrl('/restoring-encrypted-calendar')} key="learn-more">
                            {c('Action').t`Why not?`}
                        </Href>
                    );

                    setError(
                        <Banner icon="exclamation-circle" backgroundColor={BannerBackgroundColor.DANGER}>
                            {c('Email reminder decryption error').jt`Event details cannot be decrypted. ${whyNotLink}`}
                        </Banner>
                    );

                    return;
                }

                if (error.message === EVENT_NOT_FOUND_ERROR) {
                    setError(
                        <Banner icon="exclamation-circle" backgroundColor={BannerBackgroundColor.DANGER}>
                            {c('Email reminder error').t`Event is no longer in your calendar`}
                        </Banner>
                    );

                    return;
                }

                createNotification({ type: 'error', text: error.message });
            } finally {
                if (isMounted()) {
                    setIsLoading(false);
                    setLoadedWidget(message.ID);
                }
            }
        })();
    }, [calendarIdHeader, eventIdHeader, messageHasDecryptionError, message.ID, refreshCount]);

    const sanitizedAndUrlifiedLocation = useMemo(() => {
        const trimmedLocation = vevent?.location?.value?.trim();

        if (!trimmedLocation) {
            return null;
        }
        const urlified = urlify(trimmedLocation);
        const escaped = escapeInvalidHtmlTags(urlified);
        return restrictedCalendarSanitize(escaped);
    }, [vevent]);

    if (isLoading) {
        return <EmailReminderWidgetSkeleton />;
    }

    if (error && !messageHasDecryptionError) {
        return <>{error}</>;
    }

    if (
        !calendarEvent ||
        !vevent ||
        !calendar ||
        !calendarIdHeader ||
        !eventIdHeader ||
        !occurrenceHeader ||
        !sequenceHeader ||
        messageHasDecryptionError
    ) {
        return null;
    }

    const { summary, organizer, attendee, sequence } = vevent;
    const { FullDay } = calendarEvent;
    const { Name } = calendar;

    const selfAddressData = getSelfAddressData({
        organizer,
        attendees: attendee,
        addresses,
    });

    const organizerParticipant = organizer
        ? getParticipant({ participant: organizer, contactEmails, ...selfAddressData })
        : undefined;
    const participants = attendee
        ? attendee.map((participant) => getParticipant({ participant, contactEmails, ...selfAddressData }))
        : undefined;
    const participantsList = getParticipantsList(participants, organizerParticipant);

    const [startDate, endDate] = getEventLocalStartEndDates(calendarEvent, parseInt(occurrenceHeader, 10));
    const isOutdated = (sequence?.value || 0) > parseInt(`${sequenceHeader}`, 10);

    const labelClassName = 'inline-flex pt-0.5';

    return (
        <div className="calendar-widget mb-3" ref={eventReminderRef}>
            <EventReminderBanner
                startDate={startDate}
                endDate={endDate}
                isAllDay={!!FullDay}
                isCanceled={getIsEventCancelled(calendarEvent)}
                isOutdated={isOutdated}
            />
            {!isOutdated && (
                <div className="rounded border bg-norm overflow-auto">
                    <div className="p-5">
                        <h2 className="h3 mb-1 text-bold">{getDisplayTitle(summary?.value)}</h2>
                        <CalendarEventDateHeader
                            className="text-lg mt-0 mb-3"
                            startDate={startDate}
                            endDate={endDate}
                            isAllDay={!!FullDay}
                        />
                        <OpenInCalendarButton
                            linkString={c('Link to calendar event').t`Open in ${CALENDAR_APP_NAME}`}
                            calendarID={calendarEvent?.CalendarID || calendarIdHeader}
                            eventID={calendarEvent?.ID || eventIdHeader}
                            recurrenceID={parseInt(occurrenceHeader, 10)}
                        />
                    </div>
                    <hr className="m-0" />
                    <div className="p-5">
                        <IconRow title={c('Label').t`Calendar`} icon="calendar-grid" labelClassName={labelClassName}>
                            <span className="text-break">{Name}</span>
                        </IconRow>
                        {!!sanitizedAndUrlifiedLocation && (
                            <IconRow title={c('Label').t`Location`} icon="map-pin" labelClassName={labelClassName}>
                                <span dangerouslySetInnerHTML={{ __html: sanitizedAndUrlifiedLocation }} />
                            </IconRow>
                        )}
                        {!!participantsList.length && (
                            <IconRow title={c('Label').t`Participants`} icon="users" labelClassName={labelClassName}>
                                <ExtraEventParticipants list={participantsList} />
                            </IconRow>
                        )}
                    </div>
                </div>
            )}
            {linkModal}
        </div>
    );
};

export default EmailReminderWidget;
