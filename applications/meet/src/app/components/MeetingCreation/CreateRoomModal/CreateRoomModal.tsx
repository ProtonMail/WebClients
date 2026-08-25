import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useCreateMeeting } from '@proton/meet/hooks/useCreateMeeting';
import { useMeetingUpdates } from '@proton/meet/hooks/useMeetingUpdates';
import { useUpdateMeetingWaitingRoom } from '@proton/meet/hooks/useUpdateMeetingWaitingRoom';
import { useIsWaitingRoomCreationEnabled } from '@proton/meet/hooks/useWaitingRoomFlags';
import { useGetMeetings } from '@proton/meet/store/hooks/useMeetings';
import { CacheType } from '@proton/redux-utilities/interface';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import { MeetingType } from '@proton/shared/lib/interfaces/Meet';

import { useNotifyError } from '../../../hooks/useNotifyError';
import { TranslucentModal } from '../../TranslucentModal/TranslucentModal';
import { getMeetingVariantFromId } from '../shared/getMeetingVariantFromId';
import { RoomForm, type RoomFormSubmit } from './RoomForm/RoomForm';

interface CreateRoomModalProps {
    open: boolean;
    onClose: () => void;
    editedRoom: Meeting | null;
}

export const CreateRoomModal = ({ open, onClose, editedRoom }: CreateRoomModalProps) => {
    const isWaitingRoomCreationEnabled = useIsWaitingRoomCreationEnabled();

    const { createMeeting } = useCreateMeeting();
    const { createNotification } = useNotifications();
    const notifyError = useNotifyError();

    const { saveMeetingName } = useMeetingUpdates();
    const { updateMeetingWaitingRoom } = useUpdateMeetingWaitingRoom();

    const getMeetings = useGetMeetings();

    const onEdit: RoomFormSubmit = async ({ name, waitingRoom }) => {
        if (!editedRoom) {
            return;
        }

        try {
            await saveMeetingName({
                newTitle: name,
                id: editedRoom.ID,
                meetingObject: editedRoom,
            });

            if (isWaitingRoomCreationEnabled && waitingRoom !== undefined && waitingRoom !== editedRoom.WaitingRoom) {
                await updateMeetingWaitingRoom({
                    meetingLinkName: editedRoom.MeetingLinkName,
                    waitingRoom,
                });
            }

            void getMeetings({ cache: CacheType.None });

            createNotification({
                text: c('Notification').t`Room name updated`,
                type: 'info',
            });

            onClose();
        } catch (error) {
            notifyError(getApiErrorMessage(error) ?? c('Error').t`Failed to edit room name`);
        }
    };

    const onSubmit: RoomFormSubmit = async ({ name, waitingRoom }) => {
        try {
            const { meetingLink } = await createMeeting({
                meetingName: name,
                type: MeetingType.PERMANENT,
                waitingRoom,
            });

            const fullMeetingLink = getAppHref(meetingLink, APPS.PROTONMEET);
            await navigator.clipboard.writeText(fullMeetingLink);

            void getMeetings({ cache: CacheType.None });

            createNotification({
                text: c('Notification').t`Link copied to clipboard`,
                showCloseButton: false,
            });
        } catch (error) {
            notifyError(getApiErrorMessage(error) ?? c('Error').t`Failed to create meeting`);
        }

        onClose();
    };

    return (
        <TranslucentModal open={open} onClose={onClose}>
            <RoomForm
                variant={getMeetingVariantFromId(editedRoom?.ID)}
                onSubmit={editedRoom ? onEdit : onSubmit}
                initialName={editedRoom?.MeetingName}
                editMode={Boolean(editedRoom)}
                onClose={onClose}
                initialWaitingRoom={editedRoom?.WaitingRoom}
            />
        </TranslucentModal>
    );
};
