import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { reformatApiErrorMessage } from '@proton/shared/lib/calendar/helper';
import { getAttendeePartstat, getAttendeeToken } from '@proton/shared/lib/calendar/vcalHelper';
import { omit } from '@proton/shared/lib/helpers/object';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Participant, SavedInviteData } from '@proton/shared/lib/interfaces/calendar';
import { RequireSome } from '@proton/shared/lib/interfaces/utils';
import { EncryptionPreferencesError } from '@proton/shared/lib/mail/encryptionPreferences';
import { formatSubject, RE_PREFIX } from '@proton/shared/lib/mail/messages';
import {
    EVENT_INVITATION_ERROR_TYPE,
    EventInvitationError,
    getErrorMessage,
} from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import { useCallback, Dispatch, SetStateAction } from 'react';
import { InlineLinkButton, Loader, useLoading, useNotifications, CalendarInviteButtons } from '@proton/components';
import { c } from 'ttag';
import Banner, { BannerBackgroundColor } from '@proton/components/components/banner/Banner';
import { getDisableButtons, InvitationModel, UPDATE_ACTION } from '../../../../helpers/calendar/invite';
import useInviteButtons from '../../../../hooks/useInviteButtons';
import { MessageState } from '../../../../logic/messages/messagesTypes';

const { EVENT_CREATION_ERROR, EVENT_UPDATE_ERROR } = EVENT_INVITATION_ERROR_TYPE;

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    setModel: Dispatch<SetStateAction<InvitationModel>>;
    message: MessageState;
}
const ExtraEventAttendeeButtons = ({ model, setModel, message }: Props) => {
    const {
        invitationIcs,
        invitationIcs: { method },
        invitationApi,
        calendarData,
        pmData,
        singleEditData,
        isProtonInvite,
        isReinvite,
        error,
        hasDecryptionError,
        reinviteEventID,
    } = model;
    const partstat = invitationApi?.attendee?.partstat || ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
    const { attendee } = invitationApi || invitationIcs;
    const { organizer } = invitationApi || invitationIcs;

    const [loadingRetry, withLoadingRetry] = useLoading();
    const { createNotification } = useNotifications();

    const handleEmailSuccess = () => {
        createNotification({
            type: 'success',
            text: c('Reply to calendar invitation').t`Answer sent`,
        });
    };
    const handleCreateEventSuccess = () => {
        createNotification({
            type: 'success',
            text: c('Reply to calendar invitation').t`Calendar event created`,
        });
    };
    const handleUpdateEventSuccess = () => {
        createNotification({
            type: 'success',
            text: c('Reply to calendar invitation').t`Calendar event updated`,
        });
    };
    const handleSuccess = useCallback(
        ({ savedEvent, savedVevent, savedVcalAttendee }: SavedInviteData) => {
            if (!attendee) {
                throw new Error('Missing attendee');
            }
            const savedAttendee: Participant = {
                ...attendee,
                vcalComponent: savedVcalAttendee,
                partstat: getAttendeePartstat(savedVcalAttendee),
                token: getAttendeeToken(savedVcalAttendee),
            };
            const invitationApiToSave = {
                ...invitationApi,
                vevent: savedVevent,
                calendarEvent: savedEvent,
                attendee: savedAttendee,
                organizer,
            };
            setModel({
                ...omit(model, ['error', 'reinviteEventID']),
                invitationApi: invitationApiToSave,
                hideSummary: true,
                hideLink: false,
                updateAction: UPDATE_ACTION.NONE,
            });
        },
        [invitationApi, attendee, organizer]
    );

    const handleUnexpectedError = () => {
        setModel({
            ...model,
            error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR),
        });
    };
    const handleCreateEventError = (partstat: ICAL_ATTENDEE_STATUS, isProtonInvite: boolean, error?: any) => {
        const errorMessage = error?.data?.Error || error?.message || 'Creating calendar event failed';
        createNotification({
            type: 'error',
            text: errorMessage,
        });
        if (error instanceof EventInvitationError && error.type === EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR) {
            handleUnexpectedError();
            return;
        }
        setModel({
            ...model,
            hideLink: true,
            error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.EVENT_CREATION_ERROR, {
                partstat,
                isProtonInvite,
            }),
        });
    };
    const handleUpdateEventError = (
        partstat: ICAL_ATTENDEE_STATUS,
        timestamp: number,
        isProtonInvite: boolean,
        error?: any
    ) => {
        const errorMessage = error?.data?.Error || error?.message || 'Updating calendar event failed';
        createNotification({
            type: 'error',
            text: errorMessage,
        });
        if (error instanceof EventInvitationError && error.type === EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR) {
            handleUnexpectedError();
            return;
        }
        setModel({
            ...model,
            hideLink: true,
            error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.EVENT_UPDATE_ERROR, {
                partstat,
                timestamp,
                isProtonInvite,
            }),
        });
    };
    const handleEmailError = (error: Error) => {
        if (error instanceof EncryptionPreferencesError) {
            const errorMessage = reformatApiErrorMessage(error.message);
            createNotification({
                type: 'error',
                text: c('Reply to calendar invitation').t`Cannot send to organizer address: ${errorMessage}`,
            });
            return;
        }
        createNotification({
            type: 'error',
            text: c('Reply to calendar invitation').t`Answering invitation failed`,
        });
    };

    const buttonsDisabled = getDisableButtons(model);

    const actions = useInviteButtons({
        veventIcs: invitationIcs.vevent,
        veventApi: invitationApi?.vevent,
        calendarEvent: invitationApi?.calendarEvent,
        attendee,
        organizer,
        subject: formatSubject(message.data?.Subject, RE_PREFIX),
        messageID: message.data?.ID,
        calendarData,
        pmData: isProtonInvite || (pmData && isReinvite) ? pmData : undefined,
        singleEditData,
        onEmailSuccess: handleEmailSuccess,
        onCreateEventSuccess: handleCreateEventSuccess,
        onUpdateEventSuccess: handleUpdateEventSuccess,
        onEmailError: handleEmailError,
        onCreateEventError: handleCreateEventError,
        onUpdateEventError: handleUpdateEventError,
        onSuccess: handleSuccess,
        onUnexpectedError: handleUnexpectedError,
        disabled: buttonsDisabled,
        overwrite: !!hasDecryptionError,
        reinviteEventID,
    });

    if (error && [EVENT_CREATION_ERROR, EVENT_UPDATE_ERROR].includes(error.type)) {
        const { partstat, timestamp, isProtonInvite } = error;
        const { retryCreateEvent, retryUpdateEvent } = actions;
        const isUpdate = error.type === EVENT_UPDATE_ERROR;
        const message = getErrorMessage(error.type, { ...error });

        const handleRetry = () => {
            if (!partstat) {
                return withLoadingRetry(wait(0));
            }
            if (!isUpdate) {
                return retryCreateEvent(partstat, !!isProtonInvite);
            }
            if (timestamp !== undefined) {
                return retryUpdateEvent(partstat, timestamp, !!isProtonInvite);
            }
            return withLoadingRetry(wait(0));
        };

        if (loadingRetry) {
            return <Loader className="center flex mt1 mb1 " />;
        }

        return (
            <Banner
                backgroundColor={BannerBackgroundColor.DANGER}
                icon="triangle-exclamation"
                action={
                    <span className="flex-item-noshrink flex">
                        <InlineLinkButton onClick={handleRetry} className="text-underline color-inherit">
                            {c('Action').t`Try again`}
                        </InlineLinkButton>
                    </span>
                }
            >
                {message}
            </Banner>
        );
    }

    if (method === ICAL_METHOD.REQUEST && partstat) {
        return (
            <div className="mt1-5 flex flex-align-items-center">
                <div className="text-bold mr1">{c('Calendar invite buttons label').t`Attending?`}</div>
                <CalendarInviteButtons actions={actions} partstat={partstat} disabled={buttonsDisabled} />
            </div>
        );
    }
    return null;
};

export default ExtraEventAttendeeButtons;
