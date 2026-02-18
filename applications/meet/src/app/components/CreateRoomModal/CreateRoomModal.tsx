import { c } from 'ttag';

import { useNotifications } from '@proton/components/index';
import { useCreateMeeting } from '@proton/meet/hooks/useCreateMeeting';
import { useMeetingUpdates } from '@proton/meet/hooks/useMeetingUpdates';
import { useGetMeetings } from '@proton/meet/store/hooks/useMeetings';
import { CacheType } from '@proton/redux-utilities/asyncModelThunk/interface';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import { MeetingType } from '@proton/shared/lib/interfaces/Meet';

import { RoomForm } from '../RoomForm/RoomForm';
import { getRoomVariantFromId } from '../RoomForm/getRoomVariantFromId';
import { TranslucentModal } from '../TranslucentModal/TranslucentModal';

interface CreateRoomModalProps {
    open: boolean;
    onClose: () => void;
    editedRoom: Meeting | null;
}

export const CreateRoomModal = ({ open, onClose, editedRoom }: CreateRoomModalProps) => {
    const { createMeeting } = useCreateMeeting();
    const { createNotification } = useNotifications();

    const { saveMeetingName } = useMeetingUpdates();

    const getMeetings = useGetMeetings();

    const onEdit = async ({ name }: { name: string }) => {
        if (!editedRoom) {
            return;
        }

        try {
            await saveMeetingName({
                newTitle: name,
                id: editedRoom.ID,
                meetingObject: editedRoom,
            });

            void getMeetings({ cache: CacheType.None });

            createNotification({
                text: c('Notification').t`Room name updated`,
                type: 'info',
            });

            onClose();
        } catch (error) {
            createNotification({
                type: 'error',
                text: error instanceof Error ? error.message : c('Error').t`Failed to edit room name`,
            });
        }
    };

    const onSubmit = async ({ name }: { name: string }) => {
        try {
            const { meetingLink } = await createMeeting({
                meetingName: name,
                type: MeetingType.PERMANENT,
            });

            const fullMeetingLink = getAppHref(meetingLink, APPS.PROTONMEET);
            await navigator.clipboard.writeText(fullMeetingLink);

            void getMeetings({ cache: CacheType.None });

            createNotification({
                text: c('Notification').t`Link copied to clipboard`,
                showCloseButton: false,
            });
        } catch (error) {
            createNotification({
                type: 'error',
                text: error instanceof Error ? error.message : c('Error').t`Failed to create meeting`,
                showCloseButton: false,
            });
        }

        onClose();
    };

    return (
        <TranslucentModal open={open} onClose={onClose}>
            <RoomForm
                variant={getRoomVariantFromId(editedRoom?.ID)}
                onSubmit={editedRoom ? onEdit : onSubmit}
                initialName={editedRoom?.MeetingName}
                id={editedRoom?.ID}
                onClose={onClose}
            />
        </TranslucentModal>
    );
};
