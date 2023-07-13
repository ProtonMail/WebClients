import { useEffect, useState } from 'react';

import {
    useAddresses,
    useApi,
    useContactEmails,
    useEventManager,
    useGetAddressKeys,
    useGetCalendarEventRaw,
    useGetCalendarInfo,
    useGetCalendarUserSettings,
    useGetCalendars,
    useUser,
    useUserSettings,
} from '@proton/components';
import { useGetCanonicalEmailsMap } from '@proton/components/hooks/useGetCanonicalEmailsMap';
import { WorkerDecryptionResult } from '@proton/crypto';
import { arrayToBinaryString, decodeUtf8 } from '@proton/crypto/lib/utils';
import { useLoading } from '@proton/hooks';
import useIsMounted from '@proton/hooks/useIsMounted';
import {
    getCanCreateCalendar,
    getDefaultCalendar,
    getIsCalendarDisabled,
    getOwnedPersonalCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { ICAL_MIME_TYPE } from '@proton/shared/lib/calendar/constants';
import {
    EVENT_INVITATION_ERROR_TYPE,
    EventInvitationError,
} from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import { getIsVcalErrorComponent, getVcalendarHasNoErrorComponents } from '@proton/shared/lib/calendar/vcalHelper';
import { VcalErrorComponent, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { getAttachments, isBounced } from '@proton/shared/lib/mail/messages';
import isTruthy from '@proton/utils/isTruthy';
import unary from '@proton/utils/unary';

import { formatDownload } from '../../../helpers/attachment/attachmentDownloader';
import {
    EventInvitation,
    filterAttachmentsForEvents,
    getSupportedEventInvitation,
    parseVcalendar,
} from '../../../helpers/calendar/invite';
import { getOrCreatePersonalCalendarsAndSettings } from '../../../helpers/calendar/inviteApi';
import { isNetworkError } from '../../../helpers/errors';
import { getMessageHasData } from '../../../helpers/message/messages';
import { useGetMessageKeys } from '../../../hooks/message/useGetMessageKeys';
import { useGetAttachment } from '../../../hooks/useAttachment';
import { updateAttachment } from '../../../logic/attachments/attachmentsActions';
import { MessageErrors, MessageStateWithData } from '../../../logic/messages/messagesTypes';
import { errors as errorsAction } from '../../../logic/messages/read/messagesReadActions';
import { useAppDispatch } from '../../../logic/store';
import ExtraEvent from './calendar/ExtraEvent';

interface Props {
    message: MessageStateWithData;
}
const ExtraEvents = ({ message }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const isMounted = useIsMounted();
    const getMessageKeys = useGetMessageKeys();
    const getAttachment = useGetAttachment();
    const dispatch = useAppDispatch();
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
    const getCanonicalEmailsMap = useGetCanonicalEmailsMap();

    const [loadingWidget, withLoadingWidget] = useLoading();
    const [loadedWidget, setLoadedWidget] = useState('');
    const [invitations, setInvitations] = useState<(EventInvitation | EventInvitationError)[]>([]);
    const [calData, setCalData] = useState<{
        calendars: VisualCalendar[];
        defaultCalendar?: VisualCalendar;
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
                    const isFreeUser = !user.hasPaidMail;
                    const { calendars, calendarUserSettings } = await getOrCreatePersonalCalendarsAndSettings({
                        api,
                        callEventManager: call,
                        addresses,
                        isFreeUser,
                        getAddressKeys,
                        getCalendars,
                        getCalendarUserSettings,
                    });
                    const defaultCalendar = getDefaultCalendar(calendars, calendarUserSettings.DefaultCalendarID);
                    const ownedPersonalCalendars = getOwnedPersonalCalendars(calendars);
                    const disabledCalendars = ownedPersonalCalendars.filter(unary(getIsCalendarDisabled));
                    const canCreateCalendar = getCanCreateCalendar({
                        calendars,
                        ownedPersonalCalendars,
                        disabledCalendars,
                        isFreeUser,
                    });
                    const maxUserCalendarsDisabled =
                        !canCreateCalendar && ownedPersonalCalendars.length === disabledCalendars.length;

                    return {
                        calendars: ownedPersonalCalendars,
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

                    const onUpdateAttachment = (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => {
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
                                    if (!getVcalendarHasNoErrorComponents(parsedVcalendar)) {
                                        const externalError = (parsedVcalendar.components || []).find(
                                            (component): component is VcalErrorComponent =>
                                                getIsVcalErrorComponent(component)
                                        )!.error;
                                        return new EventInvitationError(
                                            EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID,
                                            { externalError }
                                        );
                                    }
                                    const { PrimaryTimezone: primaryTimezone } = await getCalendarUserSettings();
                                    const supportedEventInvitation = await getSupportedEventInvitation({
                                        vcalComponent: parsedVcalendar,
                                        message: message.data,
                                        icsBinaryString,
                                        icsFileName: attachment.Name || '',
                                        primaryTimezone,
                                    });
                                    return supportedEventInvitation;
                                } catch (error: any) {
                                    if (error instanceof EventInvitationError) {
                                        return error;
                                    }
                                    return new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, {
                                        externalError: error,
                                    });
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
    }, [message.data, message.errors, loadingConfigs, message.data.ID]);

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
                        getCanonicalEmailsMap={getCanonicalEmailsMap}
                    />
                );
            })}
        </>
    );
};

export default ExtraEvents;
