import { arrayToBinaryString, decodeUtf8 } from 'pmcrypto';
import {
    getCanCreateCalendar,
    getDefaultCalendar,
    getIsCalendarDisabled,
    getMaxUserCalendarsDisabled,
    getProbablyActiveCalendars,
} from 'proton-shared/lib/calendar/calendar';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { getAttachments } from 'proton-shared/lib/mail/messages';
import React, { useEffect, useState } from 'react';
import {
    useAddresses,
    useApi,
    useContactEmails,
    useGetCalendars,
    useGetCalendarUserSettings,
    useIsMounted,
    useLoading,
    useUser,
    useUserSettings,
} from 'react-components';
import { useAttachmentCache } from '../../../containers/AttachmentProvider';
import { updateMessageCache, useMessageCache } from '../../../containers/MessageProvider';
import { formatDownload } from '../../../helpers/attachment/attachmentDownloader';
import { EVENT_INVITATION_ERROR_TYPE, EventInvitationError } from '../../../helpers/calendar/EventInvitationError';
import {
    EventInvitation,
    filterAttachmentsForEvents,
    getSupportedEventInvitation,
    parseEventInvitation,
} from '../../../helpers/calendar/invite';
import { isNetworkError } from '../../../helpers/errors';
import { getMessageHasData } from '../../../helpers/message/messages';
import { useGetMessageKeys } from '../../../hooks/message/useGetMessageKeys';
import { MessageErrors, MessageExtended } from '../../../models/message';
import ExtraEvent from './calendar/ExtraEvent';

interface Props {
    message: MessageExtended;
}
const ExtraEvents = ({ message }: Props) => {
    const api = useApi();
    const isMounted = useIsMounted();
    const getMessageKeys = useGetMessageKeys();
    const attachmentCache = useAttachmentCache();
    const messageCache = useMessageCache();
    const getCalendars = useGetCalendars();
    const [contactEmails = [], loadingContactEmails] = useContactEmails();
    const [addresses = [], loadingAddresses] = useAddresses();
    const [user, loadingUser] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const getCalendarUserSettings = useGetCalendarUserSettings();
    const [loadingWidget, withLoadingWidget] = useLoading();
    const [widgetHasLoaded, setWidgetHasLoaded] = useState(false);
    const [invitations, setInvitations] = useState<(RequireSome<EventInvitation, 'method'> | EventInvitationError)[]>(
        []
    );
    const [calData, setCalData] = useState<{
        defaultCalendar?: Calendar;
        canCreateCalendar: boolean;
        maxUserCalendarsDisabled: boolean;
        mustReactivateCalendars: boolean;
    }>({ canCreateCalendar: true, maxUserCalendarsDisabled: false, mustReactivateCalendars: false });
    const loadingConfigs = loadingContactEmails || loadingAddresses || loadingUserSettings || loadingUser;
    const messageHasDecryptionError = !!message.errors?.decryption?.length;

    useEffect(() => {
        try {
            const attachments = getAttachments(message.data);
            const eventAttachments = filterAttachmentsForEvents(attachments);
            if (!eventAttachments.length) {
                setInvitations([]);
                return;
            }
            if (messageHasDecryptionError || loadingConfigs || !getMessageHasData(message) || widgetHasLoaded) {
                return;
            }
            const run = async () => {
                const calendars = (await getCalendars()) || [];
                const activeCalendars = getProbablyActiveCalendars(calendars);
                let defaultCalendar;
                if (calendars.length) {
                    const { DefaultCalendarID } = await getCalendarUserSettings();
                    defaultCalendar = getDefaultCalendar(activeCalendars, DefaultCalendarID);
                }
                const disabledCalendars = calendars.filter((calendar) => getIsCalendarDisabled(calendar));
                if (!isMounted()) {
                    return;
                }
                const canCreateCalendar = getCanCreateCalendar(
                    activeCalendars,
                    disabledCalendars,
                    calendars,
                    user.isFree
                );
                const maxUserCalendarsDisabled = getMaxUserCalendarsDisabled(disabledCalendars, user.isFree);
                const mustReactivateCalendars = !defaultCalendar && !canCreateCalendar && !maxUserCalendarsDisabled;
                setCalData({
                    defaultCalendar,
                    canCreateCalendar,
                    maxUserCalendarsDisabled,
                    mustReactivateCalendars,
                });
                const invitations = (
                    await Promise.all(
                        eventAttachments.map(async (attachment: Attachment) => {
                            try {
                                const messageKeys = await getMessageKeys(message.data);
                                const download = await formatDownload(
                                    attachment,
                                    message.verification,
                                    messageKeys,
                                    attachmentCache,
                                    api
                                );
                                if (download.isError) {
                                    return new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.DECRYPTION_ERROR);
                                }
                                const parsedInvitation = parseEventInvitation(
                                    decodeUtf8(arrayToBinaryString(download.data))
                                );
                                if (!parsedInvitation) {
                                    return;
                                }
                                return getSupportedEventInvitation(parsedInvitation, message.data);
                            } catch (error) {
                                if (error instanceof EventInvitationError) {
                                    return error;
                                }
                                return new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, error);
                            }
                        })
                    )
                ).filter(isTruthy);
                if (!isMounted()) {
                    return;
                }
                setInvitations(invitations);
            };

            void withLoadingWidget(run());
            void setWidgetHasLoaded(true);
        } catch (error) {
            const errors: MessageErrors = {};
            if (isNetworkError(error)) {
                errors.network = [error];
            } else {
                errors.unknown = [error];
            }
            updateMessageCache(messageCache, message.localID, { errors });
        }
    }, [message.data, message.errors, loadingConfigs]);

    if (loadingConfigs || messageHasDecryptionError || !getMessageHasData(message) || loadingWidget) {
        return null;
    }

    return (
        <>
            {invitations.map((invitation, index: number) => {
                return (
                    <ExtraEvent
                        key={index} // eslint-disable-line react/no-array-index-key
                        invitationOrError={invitation}
                        message={message}
                        defaultCalendar={calData.defaultCalendar}
                        canCreateCalendar={calData.canCreateCalendar}
                        maxUserCalendarsDisabled={calData.maxUserCalendarsDisabled}
                        mustReactivateCalendars={calData.mustReactivateCalendars}
                        contactEmails={contactEmails}
                        ownAddresses={addresses}
                        userSettings={userSettings}
                    />
                );
            })}
        </>
    );
};

export default ExtraEvents;
