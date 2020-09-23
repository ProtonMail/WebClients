import { ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import { getDisplayTitle } from 'proton-shared/lib/calendar/helper';
import { Address, ProtonConfig, UserSettings } from 'proton-shared/lib/interfaces';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { getWeekStartsOn } from 'proton-shared/lib/settings/helper';
import React, { useEffect, useState } from 'react';
import {
    Icon,
    InlineLinkButton,
    Loader,
    useApi,
    useGetCalendarEventRaw,
    useGetCalendarInfo,
    useLoading
} from 'react-components';
import { c } from 'ttag';
import {
    EVENT_INVITATION_ERROR_TYPE,
    EventInvitationError,
    getErrorMessage
} from '../../../../helpers/calendar/EventInvitationError';
import {
    EventInvitation,
    getEventTimeStatus,
    getHasInvitation,
    getInitialInvitationModel,
    getInvitationHasAttendee,
    getInvitationHasEventID,
    InvitationModel
} from '../../../../helpers/calendar/invite';
import { fetchEventInvitation, updateEventInvitation } from '../../../../helpers/calendar/inviteApi';

import { MessageExtended } from '../../../../models/message';
import ExtraEventButtons from './ExtraEventButtons';
import ExtraEventDetails from './ExtraEventDetails';
import ExtraEventSummary from './ExtraEventSummary';

interface Props {
    message: MessageExtended;
    invitationOrError: RequireSome<EventInvitation, 'method'> | EventInvitationError;
    calendars: Calendar[];
    defaultCalendar?: Calendar;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
    config: ProtonConfig;
    userSettings: UserSettings;
}
const ExtraEvent = ({
    invitationOrError,
    message,
    calendars,
    defaultCalendar,
    contactEmails,
    ownAddresses,
    config,
    userSettings
}: Props) => {
    const [model, setModel] = useState<InvitationModel>(() =>
        getInitialInvitationModel(invitationOrError, message, contactEmails, ownAddresses, defaultCalendar)
    );
    const [loading, withLoading] = useLoading(true);
    const [retryCount, setRetryCount] = useState<number>(0);
    const api = useApi();
    const getCalendarEventRaw = useGetCalendarEventRaw();
    const getCalendarInfo = useGetCalendarInfo();

    const handleRetry = () => {
        setRetryCount((count) => count + 1);
        setModel(getInitialInvitationModel(invitationOrError, message, contactEmails, ownAddresses, defaultCalendar));
        return;
    };

    const { isOrganizerMode, invitationIcs } = model;
    const method = model.invitationIcs?.method;
    const title = getDisplayTitle(invitationIcs?.vevent.summary?.value);

    useEffect(() => {
        const run = async () => {
            if (!invitationIcs?.vevent) {
                return;
            }
            let invitationApi;
            let parentInvitationApi;
            let calendarData;
            try {
                // check if an event with the same uid exists in the calendar already
                const { invitation, parentInvitation, calendar: calendarApi } = await fetchEventInvitation({
                    veventComponent: invitationIcs.vevent,
                    api,
                    getCalendarEventRaw,
                    calendars,
                    message,
                    contactEmails,
                    ownAddresses
                });
                invitationApi = invitation;
                if (parentInvitation) {
                    parentInvitationApi = parentInvitation;
                }
                const calendar = calendarApi || defaultCalendar;
                if (calendar) {
                    calendarData = { calendar, ...(await getCalendarInfo(calendar.ID)) };
                    setModel({ ...model, calendarData });
                }
            } catch (error) {
                // if fetching fails, proceed as if there was no event in the database
                return;
            }
            if (
                !invitationApi ||
                !getInvitationHasEventID(invitationApi) ||
                !getInvitationHasAttendee(invitationApi) ||
                !calendarData
            ) {
                // treat as a new invitation
                return;
            }
            // otherwise update the invitation if outdated
            try {
                const updatedInvitationApi = await updateEventInvitation({
                    isOrganizerMode,
                    invitationIcs,
                    invitationApi,
                    api,
                    calendarData,
                    message,
                    contactEmails,
                    ownAddresses
                });
                const newInvitationApi = updatedInvitationApi ? updatedInvitationApi : invitationApi;
                setModel({
                    ...model,
                    invitationApi: newInvitationApi,
                    parentInvitationApi,
                    calendarData,
                    timeStatus: getEventTimeStatus(newInvitationApi.vevent, Date.now()),
                    isUpdated: updatedInvitationApi ? true : false
                });
            } catch (e) {
                setModel({
                    ...model,
                    invitationApi,
                    parentInvitationApi,
                    error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR)
                });
            }
        };
        withLoading(run());
    }, [retryCount]);

    if (loading) {
        return (
            <div className="rounded bordered bg-white-dm mb1 pl1 pr1 pt0-5 pb0-5">
                <Loader />
            </div>
        );
    }

    if (model.error && model.error.type !== EVENT_INVITATION_ERROR_TYPE.EVENT_CREATION_ERROR) {
        const message = getErrorMessage(model.error.type);
        const canTryAgain = [
            EVENT_INVITATION_ERROR_TYPE.DECRYPTION_ERROR,
            EVENT_INVITATION_ERROR_TYPE.FETCHING_ERROR,
            EVENT_INVITATION_ERROR_TYPE.UPDATING_ERROR,
            EVENT_INVITATION_ERROR_TYPE.CANCELLATION_ERROR
        ].includes(model.error.type);

        return (
            <div className="bg-global-warning color-white rounded p0-5 mb0-5 flex flex-nowrap">
                <Icon name="attention" className="flex-item-noshrink mtauto mbauto" />
                <span className="pl0-5 pr0-5 flex-item-fluid">{message}</span>
                {canTryAgain && (
                    <span className="flex-item-noshrink flex">
                        <InlineLinkButton onClick={handleRetry} className="underline color-currentColor">
                            {c('Action').t`Try again`}
                        </InlineLinkButton>
                    </span>
                )}
            </div>
        );
    }

    if ((isOrganizerMode && method === ICAL_METHOD.REFRESH) || !getHasInvitation(model)) {
        return null;
    }

    return (
        <div className="rounded bordered bg-white-dm mb1 pl1 pr1 pt0-5 pb0-5">
            <header className="flex flex-nowrap flex-items-center">
                <Icon name="calendar" className="mr0-5 flex-item-noshrink" />
                <strong className="ellipsis flex-item-fluid" title={title}>
                    {title}
                </strong>
            </header>
            <ExtraEventSummary model={model} />
            <ExtraEventButtons model={model} setModel={setModel} message={message} config={config} />
            <ExtraEventDetails model={model} weekStartsOn={getWeekStartsOn(userSettings)} />
        </div>
    );
};

export default ExtraEvent;
