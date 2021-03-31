import { ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import { getDisplayTitle } from 'proton-shared/lib/calendar/helper';
import { Address, UserSettings } from 'proton-shared/lib/interfaces';
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
    useLoading,
} from 'react-components';
import { useGetCanonicalEmails } from 'react-components/hooks/useGetCanonicalEmails';
import { c } from 'ttag';
import useGetCalendarEventPersonal from 'react-components/hooks/useGetCalendarEventPersonal';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from '../../../../helpers/calendar/EventInvitationError';
import {
    EventInvitation,
    getEventTimeStatus,
    getHasFullCalendarData,
    getHasInvitation,
    getInitialInvitationModel,
    getInvitationHasEventID,
    getIsInvitationFromFuture,
    getIsInvitationOutdated,
    InvitationModel,
    UPDATE_ACTION,
} from '../../../../helpers/calendar/invite';
import { fetchEventInvitation, updateEventInvitation } from '../../../../helpers/calendar/inviteApi';

import { MessageExtendedWithData } from '../../../../models/message';
import ExtraEventButtons from './ExtraEventButtons';
import ExtraEventDetails from './ExtraEventDetails';
import ExtraEventSummary from './ExtraEventSummary';
import ExtraEventWarning from './ExtraEventWarning';

const {
    DECRYPTION_ERROR,
    FETCHING_ERROR,
    UPDATING_ERROR,
    CANCELLATION_ERROR,
    EVENT_CREATION_ERROR,
    EVENT_UPDATE_ERROR,
} = EVENT_INVITATION_ERROR_TYPE;

const { DECLINECOUNTER, REPLY } = ICAL_METHOD;

interface Props {
    message: MessageExtendedWithData;
    invitationOrError: RequireSome<EventInvitation, 'method'> | EventInvitationError;
    calendars: Calendar[];
    canCreateCalendar: boolean;
    maxUserCalendarsDisabled: boolean;
    mustReactivateCalendars: boolean;
    defaultCalendar?: Calendar;
    contactEmails: ContactEmail[];
    ownAddresses: Address[];
    userSettings: UserSettings;
}
const ExtraEvent = ({
    invitationOrError,
    message,
    calendars,
    defaultCalendar,
    canCreateCalendar,
    maxUserCalendarsDisabled,
    mustReactivateCalendars,
    contactEmails,
    ownAddresses,
    userSettings,
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
            mustReactivateCalendars,
        })
    );
    const [loading, withLoading] = useLoading(true);
    const [retryCount, setRetryCount] = useState<number>(0);
    const api = useApi();
    const getCalendarInfo = useGetCalendarInfo();
    const getCalendarEventRaw = useGetCalendarEventRaw();
    const getCalendarEventPersonal = useGetCalendarEventPersonal();
    const getCanonicalEmails = useGetCanonicalEmails();

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
                mustReactivateCalendars,
            })
        );
    };

    const { isOrganizerMode, invitationIcs, isPartyCrasher: isPartyCrasherIcs, pmData } = model;
    const method = model.invitationIcs?.method;
    const displayVevent =
        method && [DECLINECOUNTER, REPLY].includes(method) && model.invitationApi?.vevent
            ? model.invitationApi?.vevent
            : model.invitationIcs?.vevent;
    const title = getDisplayTitle(displayVevent?.summary?.value);

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
            let isPartyCrasher = isPartyCrasherIcs;
            try {
                // check if an event with the same uid exists in the calendar already
                const {
                    invitation,
                    parentInvitation,
                    calendarData: calData,
                    singleEditData: singleData,
                    hasDecryptionError: hasDecryptError,
                } = await fetchEventInvitation({
                    veventComponent: invitationIcs.vevent,
                    api,
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
                hasDecryptionError = hasDecryptError;
                const isOutdated = getIsInvitationOutdated({ invitationIcs, invitationApi, isOrganizerMode });
                const isFromFuture = getIsInvitationFromFuture({ invitationIcs, invitationApi, isOrganizerMode });
                if (parentInvitation) {
                    parentInvitationApi = parentInvitation;
                }
                if (isOrganizerMode && invitation) {
                    isPartyCrasher = !invitation.attendee;
                }
                if (!unmounted) {
                    setModel({
                        ...model,
                        invitationApi,
                        parentInvitationApi,
                        isOutdated,
                        isFromFuture,
                        calendarData,
                        singleEditData,
                        hasDecryptionError,
                        isPartyCrasher,
                    });
                }
            } catch (error) {
                // if fetching fails, proceed as if there was no event in the database
                return;
            }
            if (
                !invitationApi ||
                !getInvitationHasEventID(invitationApi) ||
                !getHasFullCalendarData(calendarData) ||
                calendarData.calendarNeedsUserAction ||
                unmounted
            ) {
                // treat as a new invitation
                return;
            }
            // otherwise update the invitation if outdated
            try {
                const { action: updateAction, invitation: updatedInvitationApi } = await updateEventInvitation({
                    isOrganizerMode,
                    invitationIcs,
                    invitationApi,
                    api,
                    getCanonicalEmails,
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
                        : getIsInvitationOutdated({ invitationIcs, invitationApi: newInvitationApi, isOrganizerMode });
                const isFromFuture = getIsInvitationFromFuture({
                    invitationIcs,
                    invitationApi: newInvitationApi,
                    isOrganizerMode,
                });
                if (!unmounted) {
                    setModel({
                        ...model,
                        invitationApi: newInvitationApi,
                        parentInvitationApi,
                        calendarData,
                        singleEditData,
                        timeStatus: getEventTimeStatus(newInvitationApi.vevent, Date.now()),
                        isOutdated,
                        isFromFuture,
                        updateAction,
                        hasDecryptionError,
                        isPartyCrasher,
                    });
                }
            } catch (e) {
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
        return (
            <div className="rounded bordered bg-norm mb1 pl1 pr1 pt0-5 pb0-5">
                <Loader />
            </div>
        );
    }

    if (model.error && ![EVENT_CREATION_ERROR, EVENT_UPDATE_ERROR].includes(model.error.type)) {
        const { message } = model.error;
        const canTryAgain = [DECRYPTION_ERROR, FETCHING_ERROR, UPDATING_ERROR, CANCELLATION_ERROR].includes(
            model.error.type
        );

        return (
            <div className="bg-danger rounded p0-5 mb0-5 flex flex-nowrap">
                <Icon name="attention" className="flex-item-noshrink mtauto mbauto" />
                <span className="pl0-5 pr0-5 flex-item-fluid">{message}</span>
                {canTryAgain && (
                    <span className="flex-item-noshrink flex">
                        <InlineLinkButton onClick={handleRetry} className="text-underline color-inherit">
                            {c('Action').t`Try again`}
                        </InlineLinkButton>
                    </span>
                )}
            </div>
        );
    }

    if (!getHasInvitation(model)) {
        return null;
    }

    return (
        <div className="rounded bordered bg-norm mb1 pl1 pr1 pt0-5 pb0-5 scroll-if-needed">
            <header className="flex flex-nowrap flex-align-items-center">
                <Icon name="calendar" className="mr0-5 flex-item-noshrink" />
                <strong className="text-ellipsis flex-item-fluid" title={title}>
                    {title}
                </strong>
            </header>
            <ExtraEventSummary model={model} />
            <ExtraEventWarning model={model} />
            <ExtraEventButtons model={model} setModel={setModel} message={message} />
            <ExtraEventDetails model={model} weekStartsOn={getWeekStartsOn(userSettings)} />
        </div>
    );
};

export default ExtraEvent;
