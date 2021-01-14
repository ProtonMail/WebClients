import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from 'proton-shared/lib/calendar/constants';
import { reformatApiErrorMessage } from 'proton-shared/lib/calendar/helper';
import { getAttendeePartstat } from 'proton-shared/lib/calendar/vcalHelper';
import { omit } from 'proton-shared/lib/helpers/object';
import { wait } from 'proton-shared/lib/helpers/promise';
import { Participant, SavedInviteData } from 'proton-shared/lib/interfaces/calendar';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { EncryptionPreferencesError } from 'proton-shared/lib/mail/encryptionPreferences';
import { formatSubject, RE_PREFIX } from 'proton-shared/lib/mail/messages';
import React, { useCallback, Dispatch, SetStateAction } from 'react';
import { Icon, InlineLinkButton, Loader, useLoading, useNotifications } from 'react-components';
import InviteButtons from 'react-components/components/calendar/InviteButtons';
import { c } from 'ttag';
import {
    EVENT_INVITATION_ERROR_TYPE,
    EventInvitationError,
    getErrorMessage,
} from '../../../../helpers/calendar/EventInvitationError';
import { InvitationModel, UPDATE_ACTION } from '../../../../helpers/calendar/invite';
import useInviteButtons from '../../../../hooks/useInviteButtons';
import { MessageExtended } from '../../../../models/message';

const { EVENT_CREATION_ERROR, EVENT_UPDATE_ERROR } = EVENT_INVITATION_ERROR_TYPE;

interface Props {
    model: RequireSome<InvitationModel, 'invitationIcs'>;
    setModel: Dispatch<SetStateAction<InvitationModel>>;
    message: MessageExtended;
}
const ExtraEventAttendeeButtons = ({ model, setModel, message }: Props) => {
    const {
        invitationIcs,
        invitationIcs: { method },
        invitationApi,
        calendarData,
        isAddressDisabled,
        error,
        hasDecryptionError,
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
            };
            const invitationApiToSave = {
                ...invitationApi,
                vevent: savedVevent,
                calendarEvent: savedEvent,
                attendee: savedAttendee,
                organizer,
            };
            setModel({
                ...omit(model, ['error']),
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
    const handleCreateEventError = (partstat: ICAL_ATTENDEE_STATUS) => {
        createNotification({
            type: 'error',
            text: c('Reply to calendar invitation').t`Creating calendar event failed`,
        });
        if (error instanceof EventInvitationError && error.type === EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR) {
            handleUnexpectedError();
            return;
        }
        setModel({
            ...model,
            hideLink: true,
            error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.EVENT_CREATION_ERROR, { partstat }),
        });
    };
    const handleUpdateEventError = (partstat: ICAL_ATTENDEE_STATUS) => {
        createNotification({
            type: 'error',
            text: c('Reply to calendar invitation').t`Updating calendar event failed`,
        });
        if (error instanceof EventInvitationError && error.type === EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_ERROR) {
            handleUnexpectedError();
            return;
        }
        setModel({
            ...model,
            hideLink: true,
            error: new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.EVENT_UPDATE_ERROR, { partstat }),
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

    const buttonsDisabled =
        !calendarData?.calendar ||
        calendarData.isCalendarDisabled ||
        isAddressDisabled ||
        calendarData.calendarNeedsUserAction;

    const actions = useInviteButtons({
        veventIcs: invitationIcs.vevent,
        veventApi: invitationApi?.vevent,
        calendarEvent: invitationApi?.calendarEvent,
        attendee,
        organizer,
        subject: formatSubject(message.data?.Subject, RE_PREFIX),
        calendarData,
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
    });

    if (error && [EVENT_CREATION_ERROR, EVENT_UPDATE_ERROR].includes(error.type)) {
        const { partstat } = error;
        const { retryCreateEvent, retryUpdateEvent } = actions;
        const message = getErrorMessage(error.type);
        const handleRetry = partstat
            ? () =>
                  withLoadingRetry(
                      error.type === EVENT_UPDATE_ERROR ? retryUpdateEvent(partstat) : retryCreateEvent(partstat)
                  )
            : () => withLoadingRetry(wait(0));

        if (loadingRetry) {
            return <Loader className="center flex mt1 mb1 " />;
        }

        return (
            <div className="bg-global-warning color-white rounded p0-5 mb0-5 flex flex-nowrap">
                <Icon name="attention" className="flex-item-noshrink mtauto mbauto" />
                <span className="pl0-5 pr0-5 flex-item-fluid">{message}</span>
                <span className="flex-item-noshrink flex">
                    <InlineLinkButton onClick={handleRetry} className="underline color-currentColor">
                        {c('Action').t`Try again`}
                    </InlineLinkButton>
                </span>
            </div>
        );
    }

    if (method === ICAL_METHOD.REQUEST && partstat) {
        return <InviteButtons actions={actions} partstat={partstat} disabled={buttonsDisabled} className="mb0-5" />;
    }
    return null;
};

export default ExtraEventAttendeeButtons;
