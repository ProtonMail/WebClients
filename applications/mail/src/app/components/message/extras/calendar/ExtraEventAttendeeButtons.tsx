import { Dispatch, SetStateAction, useCallback } from 'react';

import { c } from 'ttag';

import {
    CalendarInviteButtons,
    InlineLinkButton,
    Loader,
    useLoading,
    useNotifications,
    useSideApp,
} from '@proton/components';
import Banner, { BannerBackgroundColor } from '@proton/components/components/banner/Banner';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { reformatApiErrorMessage } from '@proton/shared/lib/calendar/helper';
import {
    EVENT_INVITATION_ERROR_TYPE,
    EventInvitationError,
    getErrorMessage,
} from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import { getAttendeePartstat, getAttendeeToken } from '@proton/shared/lib/calendar/vcalHelper';
import { APPS } from '@proton/shared/lib/constants';
import { ApiError } from '@proton/shared/lib/fetch/ApiError';
import { omit } from '@proton/shared/lib/helpers/object';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Participant, SavedInviteData } from '@proton/shared/lib/interfaces/calendar';
import { RequireSome } from '@proton/shared/lib/interfaces/utils';
import { EncryptionPreferencesError } from '@proton/shared/lib/mail/encryptionPreferences';
import { RE_PREFIX, formatSubject } from '@proton/shared/lib/mail/messages';
import { postMessageToIframe } from '@proton/shared/lib/sideApp/helpers';
import { SIDE_APP_EVENTS } from '@proton/shared/lib/sideApp/models';

import { InvitationModel, UPDATE_ACTION, getDisableButtons } from '../../../../helpers/calendar/invite';
import useInviteButtons from '../../../../hooks/useInviteButtons';
import { MessageState } from '../../../../logic/messages/messagesTypes';

const { EVENT_CREATION_ERROR, EVENT_UPDATE_ERROR } = EVENT_INVITATION_ERROR_TYPE;

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    setModel: Dispatch<SetStateAction<InvitationModel>>;
    message: MessageState;
    reloadWidget: () => void;
}
const ExtraEventAttendeeButtons = ({ model, setModel, message, reloadWidget }: Props) => {
    const {
        invitationIcs,
        invitationIcs: { method },
        invitationApi,
        calendarData,
        pmData,
        singleEditData,
        reencryptionData,
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
    const { sideAppUrl } = useSideApp();

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
            const newModel = {
                ...omit(model, ['error', 'reinviteEventID', 'reencryptionData']),
                invitationApi: invitationApiToSave,
                hideSummary: true,
                hideLink: false,
                updateAction: UPDATE_ACTION.NONE,
            };

            setModel(newModel);

            // If the calendar app is opened in the side panel,
            // we want to call the calendar event manager to refresh the view
            if (sideAppUrl) {
                postMessageToIframe(
                    {
                        type: SIDE_APP_EVENTS.SIDE_APP_CALL_CALENDAR_EVENT_MANAGER,
                        payload: { calendarID: savedEvent.CalendarID },
                    },
                    APPS.PROTONCALENDAR
                );
            }
        },
        [invitationApi, attendee, organizer, sideAppUrl]
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
    const handleReencryptEventError = (error: Error) => {
        reloadWidget();
        // A retry should fix this error, so we display to the user a custom message asking to retry
        createNotification({
            type: 'error',
            text: c('Reply to calendar invitation').t`Re-encrypting invitation failed. Please try again.`,
        });
        // we console.log the real error in case there's a systematic problem
        const errorMessage = error instanceof ApiError ? getApiErrorMessage(error) : error.message;
        console.error(errorMessage);
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
        reencryptionData,
        onEmailSuccess: handleEmailSuccess,
        onCreateEventSuccess: handleCreateEventSuccess,
        onUpdateEventSuccess: handleUpdateEventSuccess,
        onEmailError: handleEmailError,
        onCreateEventError: handleCreateEventError,
        onUpdateEventError: handleUpdateEventError,
        onReencryptEventError: handleReencryptEventError,
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
                return retryCreateEvent({ partstat, isProtonInvite: !!isProtonInvite });
            }
            if (timestamp !== undefined) {
                return retryUpdateEvent({
                    partstat,
                    timestamp,
                    isProtonInvite: !!isProtonInvite,
                    calendarEvent: invitationApi?.calendarEvent,
                });
            }
            return withLoadingRetry(wait(0));
        };

        if (loadingRetry) {
            return <Loader className="center flex mt1 mb1 " />;
        }

        return (
            <Banner
                backgroundColor={BannerBackgroundColor.DANGER}
                icon="exclamation-circle"
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
