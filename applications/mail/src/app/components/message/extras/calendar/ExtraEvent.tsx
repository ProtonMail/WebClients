import { generateAttendeeToken } from '@proton/shared/lib/calendar/attendees';
import { canonizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import { Address, UserSettings } from '@proton/shared/lib/interfaces';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import { GetCalendarEventPersonal } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventPersonal';
import { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';
import { GetCalendarInfo } from '@proton/shared/lib/interfaces/hooks/GetCalendarInfo';
import { GetCanonicalEmailsMap } from '@proton/shared/lib/interfaces/hooks/GetCanonicalEmailsMap';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';
import {
    EVENT_INVITATION_ERROR_TYPE,
    EventInvitationError,
} from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import { useEffect, useState } from 'react';
import { Banner, InlineLinkButton, useApi, useLoading } from '@proton/components';
import { c } from 'ttag';
import { BannerBackgroundColor } from '@proton/components/components/banner/Banner';
import {
    EventInvitation,
    getEventTimeStatus,
    getHasFullCalendarData,
    getHasInvitationIcs,
    getInitialInvitationModel,
    getInvitationHasEventID,
    getIsInvitationFromFuture,
    getIsReinvite,
    getIsInvitationOutdated,
    InvitationModel,
    UPDATE_ACTION,
    getIsProtonInvite,
} from '../../../../helpers/calendar/invite';
import { fetchEventInvitation, updateEventInvitation } from '../../../../helpers/calendar/inviteApi';
import ExtraEventButtons from './ExtraEventButtons';
import ExtraEventDetails from './ExtraEventDetails';
import ExtraEventHeader from './ExtraEventHeader';
import ExtraEventSummary from './ExtraEventSummary';
import ExtraEventTimeStatus from './ExtraEventTimeStatus';
import ExtraEventWarning from './ExtraEventWarning';
import EmailReminderWidgetSkeleton from './EmailReminderWidgetSkeleton';
import { MessageStateWithData } from '../../../../logic/messages/messagesTypes';
import './CalendarWidget.scss';

const {
    DECRYPTION_ERROR,
    FETCHING_ERROR,
    UPDATING_ERROR,
    CANCELLATION_ERROR,
    EVENT_CREATION_ERROR,
    EVENT_UPDATE_ERROR,
} = EVENT_INVITATION_ERROR_TYPE;

interface Props {
    message: MessageStateWithData;
    invitationOrError: EventInvitation | EventInvitationError;
    canCreateCalendar: boolean;
    maxUserCalendarsDisabled: boolean;
    calendars: Calendar[];
    defaultCalendar?: Calendar;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
    userSettings: UserSettings;
    getAddressKeys: GetAddressKeys;
    getCalendarInfo: GetCalendarInfo;
    getCalendarEventRaw: GetCalendarEventRaw;
    getCalendarEventPersonal: GetCalendarEventPersonal;
    getCanonicalEmailsMap: GetCanonicalEmailsMap;
}
const ExtraEvent = ({
    invitationOrError,
    message,
    calendars,
    defaultCalendar,
    canCreateCalendar,
    maxUserCalendarsDisabled,
    contactEmails,
    ownAddresses,
    userSettings,
    getAddressKeys,
    getCalendarInfo,
    getCalendarEventRaw,
    getCalendarEventPersonal,
    getCanonicalEmailsMap,
}: Props) => {
    const [model, setModel] = useState<InvitationModel>(() =>
        getInitialInvitationModel({
            invitationOrError,
            message,
            contactEmails,
            ownAddresses,
            calendar: defaultCalendar,
            hasNoCalendars: calendars.length === 0,
            canCreateCalendar,
            maxUserCalendarsDisabled,
        })
    );
    const [loading, withLoading] = useLoading(true);
    const [retryCount, setRetryCount] = useState<number>(0);
    const api = useApi();

    const handleRetry = () => {
        setRetryCount((count) => count + 1);
        setModel(
            getInitialInvitationModel({
                invitationOrError,
                message,
                contactEmails,
                ownAddresses,
                calendar: defaultCalendar,
                hasNoCalendars: calendars.length === 0,
                canCreateCalendar,
                maxUserCalendarsDisabled,
            })
        );
    };

    const { isOrganizerMode, invitationIcs, isPartyCrasher: isPartyCrasherIcs, pmData } = model;

    useEffect(() => {
        let unmounted = false;
        const run = async () => {
            if (!invitationIcs?.vevent) {
                return;
            }
            let invitationApi;
            let parentInvitationApi;
            let calendarData;
            let hasDecryptionError;
            let singleEditData;
            let reencryptionData;
            let reinviteEventID;
            let isPartyCrasher = isPartyCrasherIcs;
            const supportedInvitationIcs = invitationIcs;
            try {
                // check if an event with the same uid exists in the calendar already
                const {
                    invitation,
                    parentInvitation,
                    calendarData: calData,
                    calendarEvent,
                    singleEditData: singleData,
                    reencryptionData: reencryptData,
                    hasDecryptionError: hasDecryptError,
                    supportedRecurrenceId,
                } = await fetchEventInvitation({
                    veventComponent: invitationIcs.vevent,
                    api,
                    getAddressKeys,
                    getCalendarInfo,
                    getCalendarEventRaw,
                    getCalendarEventPersonal,
                    calendars,
                    defaultCalendar,
                    message,
                    contactEmails,
                    ownAddresses,
                });
                invitationApi = invitation;
                calendarData = calData;
                singleEditData = singleData;
                reencryptionData = reencryptData;
                hasDecryptionError = hasDecryptError;
                const isOutdated = getIsInvitationOutdated({ invitationIcs, invitationApi, isOrganizerMode });
                const isFromFuture = getIsInvitationFromFuture({ invitationIcs, invitationApi, isOrganizerMode });
                const isProtonInvite = getIsProtonInvite({ invitationIcs, calendarEvent, pmData });
                const isReinvite = getIsReinvite({ invitationIcs, calendarEvent, isOrganizerMode, isOutdated });
                if (isReinvite) {
                    reinviteEventID = calendarEvent?.ID;
                    // ignore existing partstat
                    delete invitationApi?.attendee?.partstat;
                }
                if (parentInvitation) {
                    parentInvitationApi = parentInvitation;
                }
                if (supportedRecurrenceId) {
                    supportedInvitationIcs.vevent['recurrence-id'] = supportedRecurrenceId;
                }
                if (isOrganizerMode) {
                    // after fetching the DB event we can determine party crasher status on organizer mode
                    if (invitationApi) {
                        isPartyCrasher = !invitationApi.attendee;
                    } else if (calendarEvent) {
                        // if we do not have invitationApi, it means we could not decrypt calendarEvent
                        // we can resort to checking attendee tokens in this case, since those are clear text
                        const senderToken = await generateAttendeeToken(
                            canonizeEmailByGuess(message.data.Sender.Address),
                            calendarEvent.UID
                        );
                        isPartyCrasher = !calendarEvent.Attendees.some(({ Token }) => Token === senderToken);
                    }
                }
                if (!unmounted) {
                    setModel({
                        ...model,
                        invitationIcs: supportedInvitationIcs,
                        invitationApi,
                        parentInvitationApi,
                        isOutdated,
                        isFromFuture,
                        isProtonInvite,
                        isReinvite,
                        reinviteEventID,
                        calendarData,
                        singleEditData,
                        reencryptionData,
                        hasDecryptionError,
                        isPartyCrasher,
                    });
                }
            } catch (error: any) {
                // if fetching fails, proceed as if there was no event in the database
                return;
            }
            if (
                !invitationApi ||
                !getInvitationHasEventID(invitationApi) ||
                !getHasFullCalendarData(calendarData) ||
                calendarData?.calendarNeedsUserAction ||
                unmounted
            ) {
                // treat as a new invitation
                return;
            }
            // otherwise update the invitation if outdated
            try {
                const { action: updateAction, invitation: updatedInvitationApi } = await updateEventInvitation({
                    isOrganizerMode,
                    invitationIcs: supportedInvitationIcs,
                    invitationApi,
                    api,
                    getCanonicalEmailsMap,
                    calendarData,
                    singleEditData,
                    pmData,
                    message,
                    contactEmails,
                    ownAddresses,
                    overwrite: !!hasDecryptionError,
                });
                const newInvitationApi = updatedInvitationApi || invitationApi;
                const isOutdated =
                    updateAction !== UPDATE_ACTION.NONE
                        ? false
                        : getIsInvitationOutdated({
                              invitationIcs: supportedInvitationIcs,
                              invitationApi: newInvitationApi,
                              isOrganizerMode,
                          });
                const isFromFuture = getIsInvitationFromFuture({
                    invitationIcs: supportedInvitationIcs,
                    invitationApi: newInvitationApi,
                    isOrganizerMode,
                });
                const isProtonInvite = getIsProtonInvite({
                    invitationIcs: supportedInvitationIcs,
                    calendarEvent: newInvitationApi.calendarEvent,
                    pmData,
                });
                const isReinvite = getIsReinvite({
                    invitationIcs: supportedInvitationIcs,
                    calendarEvent: newInvitationApi.calendarEvent,
                    isOrganizerMode,
                    isOutdated,
                });
                if (!unmounted) {
                    setModel({
                        ...model,
                        invitationIcs: supportedInvitationIcs,
                        invitationApi: newInvitationApi,
                        parentInvitationApi,
                        calendarData,
                        singleEditData,
                        reencryptionData,
                        timeStatus: getEventTimeStatus(newInvitationApi.vevent, Date.now()),
                        isOutdated,
                        isFromFuture,
                        isProtonInvite,
                        isReinvite,
                        reinviteEventID,
                        updateAction,
                        hasDecryptionError,
                        isPartyCrasher,
                    });
                }
            } catch (e: any) {
                if (!unmounted) {
                    setModel({
                        ...model,
                        invitationApi,
                        parentInvitationApi,
                        error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR),
                    });
                }
            }
        };

        void withLoading(run());

        return () => {
            unmounted = true;
        };
    }, [retryCount]);

    if (loading) {
        return <EmailReminderWidgetSkeleton />;
    }

    if (model.error && ![EVENT_CREATION_ERROR, EVENT_UPDATE_ERROR].includes(model.error.type)) {
        const { message } = model.error;
        const canTryAgain = [DECRYPTION_ERROR, FETCHING_ERROR, UPDATING_ERROR, CANCELLATION_ERROR].includes(
            model.error.type
        );

        return (
            <Banner
                backgroundColor={BannerBackgroundColor.DANGER}
                icon="triangle-exclamation"
                action={
                    canTryAgain && (
                        <span className="flex-item-noshrink flex">
                            <InlineLinkButton onClick={handleRetry} className="text-underline color-inherit">
                                {c('Action').t`Try again`}
                            </InlineLinkButton>
                        </span>
                    )
                }
            >
                {message}
            </Banner>
        );
    }

    if (!getHasInvitationIcs(model)) {
        return null;
    }

    return (
        <div className="calendar-widget">
            <ExtraEventTimeStatus model={model} />
            <div className="rounded border bg-norm mb0-5 scroll-if-needed">
                <div className="p1-5">
                    <ExtraEventSummary model={model} />
                    <ExtraEventHeader model={model} />
                    <ExtraEventWarning model={model} />
                    <ExtraEventButtons model={model} setModel={setModel} message={message} />
                </div>
                <hr className="m0" />
                <ExtraEventDetails model={model} weekStartsOn={getWeekStartsOn(userSettings)} />
            </div>
        </div>
    );
};

export default ExtraEvent;
