import React, { useEffect, useState } from 'react';
import { Loader, useApi, useCalendars, useContactEmails, useLoading } from 'react-components';
import { arrayToBinaryString } from 'pmcrypto';
import { getDefaultCalendar, getProbablyActiveCalendars } from 'proton-shared/lib/calendar/calendar';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { getCalendarUserSettingsModel } from 'proton-shared/lib/models/calendarSettingsModel';
import { useAttachmentCache } from '../../../containers/AttachmentProvider';
import { formatDownload } from '../../../helpers/attachment/attachmentDownloader';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from '../../../helpers/calendar/EventInvitationError';
import {
    EventInvitationRaw,
    filterAttachmentsForEvents,
    getSupportedEventInvitation,
    parseEventInvitation
} from '../../../helpers/calendar/invite';

import { getAttachments } from '../../../helpers/message/messages';
import { Attachment } from '../../../models/attachment';
import { MessageExtended } from '../../../models/message';
import ExtraEvent from './calendar/ExtraEvent';

interface Props {
    message: MessageExtended;
}
const ExtraEvents = ({ message }: Props) => {
    const cache = useAttachmentCache();
    const [loading, withLoading] = useLoading();
    const [calendars = []] = useCalendars();
    const [contactEmails = [], loadingContactEmails] = useContactEmails() as [
        ContactEmail[] | undefined,
        boolean,
        Error
    ];
    const [invitations, setInvitations] = useState<(EventInvitationRaw | EventInvitationError)[]>([]);
    const [defaultCalendar, setDefaultCalendar] = useState<Calendar | undefined>();
    const api = useApi();

    useEffect(() => {
        const run = async () => {
            if (!message.privateKeys) {
                return;
            }
            if (calendars?.length) {
                const { DefaultCalendarID } = await getCalendarUserSettingsModel(api);
                const activeCalendars = getProbablyActiveCalendars(calendars);
                const defaultCalendar = getDefaultCalendar(activeCalendars, DefaultCalendarID);
                setDefaultCalendar(defaultCalendar);
            }
            const attachments = getAttachments(message.data);
            const eventAttachments = filterAttachmentsForEvents(attachments);
            const invitations = (
                await Promise.all(
                    eventAttachments.map(async (attachment: Attachment) => {
                        try {
                            const download = await formatDownload(attachment, message, cache, api);
                            if (download.isError) {
                                return new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.DECRYPTION_ERROR);
                            }
                            const parsedInvitation = parseEventInvitation(arrayToBinaryString(download.data));
                            if (!parsedInvitation) {
                                return;
                            }
                            return getSupportedEventInvitation(parsedInvitation);
                        } catch (error) {
                            if (error instanceof EventInvitationError) {
                                return error;
                            }
                            return new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, error);
                        }
                    })
                )
            ).filter(isTruthy);
            setInvitations(invitations);
        };

        withLoading(run());
    }, [message.privateKeys]);

    if (loading || loadingContactEmails) {
        return <Loader />;
    }

    return (
        <>
            {invitations.map((invitation, index: number) => {
                return (
                    <ExtraEvent
                        key={index}
                        invitationOrError={invitation}
                        message={message}
                        calendars={calendars}
                        defaultCalendar={defaultCalendar}
                        contactEmails={contactEmails}
                    />
                );
            })}
        </>
    );
};

export default ExtraEvents;
