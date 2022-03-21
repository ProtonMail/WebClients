import useGetCalendarEventPersonal from '@proton/components/hooks/useGetCalendarEventPersonal';
import { useGetCanonicalEmailsMap } from '@proton/components/hooks/useGetCanonicalEmailsMap';
import { arrayToBinaryString, decodeUtf8, DecryptResultPmcrypto } from 'pmcrypto';
import {
    getCanCreateCalendar,
    getDefaultCalendar,
    getIsCalendarDisabled,
    getMaxUserCalendarsDisabled,
    getProbablyActiveCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { ICAL_MIME_TYPE } from '@proton/shared/lib/calendar/constants';
import { unary } from '@proton/shared/lib/helpers/function';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getAttachments, isBounced } from '@proton/shared/lib/mail/messages';
import {
    EVENT_INVITATION_ERROR_TYPE,
    EventInvitationError,
} from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import { useEffect, useState } from 'react';
import {
    useAddresses,
    useGetAddressKeys,
    useApi,
    useContactEmails,
    useGetCalendars,
    useGetCalendarUserSettings,
    useIsMounted,
    useLoading,
    useUser,
    useUserSettings,
    useGetCalendarInfo,
    useGetCalendarEventRaw,
} from '@proton/components';
import { useDispatch } from 'react-redux';
import { formatDownload } from '../../../helpers/attachment/attachmentDownloader';
import {
    EventInvitation,
    filterAttachmentsForEvents,
    getSupportedEventInvitation,
    parseVcalendar,
} from '../../../helpers/calendar/invite';
import { isNetworkError } from '../../../helpers/errors';
import { getMessageHasData } from '../../../helpers/message/messages';
import { useGetMessageKeys } from '../../../hooks/message/useGetMessageKeys';
import ExtraEvent from './calendar/ExtraEvent';
import { updateAttachment } from '../../../logic/attachments/attachmentsActions';
import { useGetAttachment } from '../../../hooks/useAttachment';
import { getOrCreatePersonalCalendarsAndSettings } from '../../../helpers/calendar/inviteApi';
import { MessageStateWithData, MessageErrors } from '../../../logic/messages/messagesTypes';
import { errors as errorsAction } from '../../../logic/messages/read/messagesReadActions';

interface Props {
    message: MessageStateWithData;
}
const ExtraEvents = ({ message }: Props) => {
    const api = useApi();
    const isMounted = useIsMounted();
    const getMessageKeys = useGetMessageKeys();
    const getAttachment = useGetAttachment();
    const dispatch = useDispatch();
    // const messageCache = useMessageCache();
    const getCalendars = useGetCalendars();
    const [contactEmails = [], loadingContactEmails] = useContactEmails();
    const [addresses = [], loadingAddresses] = useAddresses();
    const getAddressKeys = useGetAddressKeys();
    const [user, loadingUser] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const getCalendarUserSettings = useGetCalendarUserSettings();
    const getCalendarInfo = useGetCalendarInfo();
    const getCalendarEventRaw = useGetCalendarEventRaw();
    const getCalendarEventPersonal = useGetCalendarEventPersonal();
    const getCanonicalEmailsMap = useGetCanonicalEmailsMap();

    const [loadingWidget, withLoadingWidget] = useLoading();
    const [loadedWidget, setLoadedWidget] = useState('');
    const [invitations, setInvitations] = useState<(EventInvitation | EventInvitationError)[]>([]);
    const [calData, setCalData] = useState<{
        calendars: Calendar[];
        defaultCalendar?: Calendar;
        canCreateCalendar: boolean;
        maxUserCalendarsDisabled: boolean;
    }>({ calendars: [], canCreateCalendar: true, maxUserCalendarsDisabled: false });

    const loadingConfigs = loadingContactEmails || loadingAddresses || loadingUserSettings || loadingUser;
    const messageHasDecryptionError = !!message.errors?.decryption?.length;
    const isBouncedEmail = isBounced(message.data);

    useEffect(() => {
        try {
            const attachments = getAttachments(message.data);
            const eventAttachments = filterAttachmentsForEvents(attachments);
            if (
                !eventAttachments.length ||
                messageHasDecryptionError ||
                isBouncedEmail ||
                loadingConfigs ||
                !getMessageHasData(message)
            ) {
                // widget should not be displayed under these circumstances
                // clear up React states in case this component does not unmount when opening new emails
                setInvitations([]);
                setLoadedWidget('');
                return;
            }
            if (loadedWidget === message.data.ID) {
                // avoid re-loading widget if it has been loaded already
                return;
            }
            const run = async () => {
                const getCalData = async () => {
                    const { calendars, calendarUserSettings } = await getOrCreatePersonalCalendarsAndSettings({
                        api,
                        addresses,
                        getAddressKeys,
                        getCalendars,
                        getCalendarUserSettings,
                    });
                    const activeCalendars = getProbablyActiveCalendars(calendars);
                    const defaultCalendar = getDefaultCalendar(activeCalendars, calendarUserSettings.DefaultCalendarID);
                    const disabledCalendars = calendars.filter(unary(getIsCalendarDisabled));
                    const canCreateCalendar = getCanCreateCalendar(
                        activeCalendars,
                        disabledCalendars,
                        calendars,
                        user.isFree
                    );
                    const maxUserCalendarsDisabled = getMaxUserCalendarsDisabled(disabledCalendars, user.isFree);

                    return {
                        calendars,
                        defaultCalendar,
                        canCreateCalendar,
                        maxUserCalendarsDisabled,
                    };
                };
                const getInvitations = async () => {
                    // re-order attachments by MIME Type, as we prefer 'text/calendar' in case of duplicate uids
                    const sortedEventAttachments = [...eventAttachments].sort(({ MIMEType: a }, { MIMEType: b }) => {
                        if (a === ICAL_MIME_TYPE) {
                            return -1;
                        }
                        if (b === ICAL_MIME_TYPE) {
                            return 1;
                        }
                        return 0;
                    });

                    const onUpdateAttachment = (ID: string, attachment: DecryptResultPmcrypto) => {
                        dispatch(updateAttachment({ ID, attachment }));
                    };

                    const invitations = (
                        await Promise.all(
                            sortedEventAttachments.map(async (attachment: Attachment) => {
                                try {
                                    const messageKeys = await getMessageKeys(message.data);
                                    const download = await formatDownload(
                                        attachment,
                                        message.verification,
                                        messageKeys,
                                        onUpdateAttachment,
                                        api,
                                        getAttachment
                                    );
                                    if (download.isError) {
                                        return new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.DECRYPTION_ERROR);
                                    }
                                    const icsBinaryString = arrayToBinaryString(download.data);
                                    const parsedVcalendar = parseVcalendar(decodeUtf8(icsBinaryString));
                                    if (!parsedVcalendar) {
                                        return;
                                    }
                                    const supportedEventInvitation = await getSupportedEventInvitation({
                                        vcalComponent: parsedVcalendar,
                                        message: message.data,
                                        icsBinaryString,
                                        icsFileName: attachment.Name || '',
                                    });
                                    return supportedEventInvitation;
                                } catch (error: any) {
                                    if (error instanceof EventInvitationError) {
                                        return error;
                                    }
                                    return new EventInvitationError(
                                        EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID,
                                        error
                                    );
                                }
                            })
                        )
                    ).filter(isTruthy);
                    const { uniqueInvitations } = invitations.reduce<{
                        uniqueInvitations: (EventInvitation | EventInvitationError)[];
                        uniqueUids: string[];
                    }>(
                        (acc, invitation) => {
                            const { uniqueInvitations, uniqueUids } = acc;
                            const uid = invitation.originalUniqueIdentifier;
                            if (!uid) {
                                uniqueInvitations.push(invitation);
                                return acc;
                            }
                            if (uniqueUids.includes(uid)) {
                                return acc;
                            }
                            uniqueUids.push(uid);
                            uniqueInvitations.push(invitation);
                            return acc;
                        },
                        { uniqueInvitations: [], uniqueUids: [] }
                    );
                    return uniqueInvitations;
                };

                const [calData, invitations] = await Promise.all([getCalData(), getInvitations()]);
                if (!isMounted()) {
                    return;
                }
                setCalData(calData);
                setInvitations(invitations);
            };

            void withLoadingWidget(run());
            void setLoadedWidget(message.data.ID);
        } catch (error: any) {
            const errors: MessageErrors = {};
            if (isNetworkError(error)) {
                errors.network = [error];
            } else {
                errors.unknown = [error];
            }
            dispatch(errorsAction({ ID: message.localID, errors }));
        }
    }, [message.data, message.errors, loadingConfigs, message.data?.ID]);

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
                        calendars={calData.calendars}
                        defaultCalendar={calData.defaultCalendar}
                        canCreateCalendar={calData.canCreateCalendar}
                        maxUserCalendarsDisabled={calData.maxUserCalendarsDisabled}
                        contactEmails={contactEmails}
                        ownAddresses={addresses}
                        userSettings={userSettings}
                        getAddressKeys={getAddressKeys}
                        getCalendarInfo={getCalendarInfo}
                        getCalendarEventRaw={getCalendarEventRaw}
                        getCalendarEventPersonal={getCalendarEventPersonal}
                        getCanonicalEmailsMap={getCanonicalEmailsMap}
                    />
                );
            })}
        </>
    );
};

export default ExtraEvents;
