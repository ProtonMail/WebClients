import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useDeleteMeeting } from '@proton/meet/hooks/useDeleteMeeting';
import { useGetMeetings } from '@proton/meet/store/hooks/useMeetings';
import { CacheType } from '@proton/redux-utilities/asyncModelThunk/interface';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface DeleteMeetingModalProps {
    meetingId: string;
    onClose: () => void;
    onDelete?: () => void;
    isRoom: boolean;
}

export const DeleteMeetingModal = ({ meetingId, onClose, onDelete, isRoom }: DeleteMeetingModalProps) => {
    const notifications = useNotifications();
    const deleteMeeting = useDeleteMeeting();

    const getMeetings = useGetMeetings();

    const handleClick = async () => {
        try {
            await deleteMeeting.deleteMeeting(meetingId);
            onClose();
            onDelete?.();

            const notificationText = isRoom ? c('Error').t`Room deleted` : c('Error').t`Event deleted`;

            notifications.createNotification({ type: 'info', text: notificationText });

            void getMeetings({ cache: CacheType.None });
        } catch {
            const notificationText = isRoom
                ? c('Error').t`Failed to delete room`
                : c('Error').t`Failed to delete event`;
            notifications.createNotification({ text: notificationText, type: 'error' });
        }
    };

    return (
        <ConfirmationModal
            title={isRoom ? c('Info').t`Delete room` : c('Info').t`Delete event`}
            message={
                isRoom
                    ? c('Info').t`Would you like to delete this room?`
                    : c('Info').t`Would you like to delete this event?`
            }
            primaryText={c('Action').t`Delete`}
            primaryButtonClass="danger"
            onPrimaryAction={handleClick}
            onSecondaryAction={onClose}
            onClose={onClose}
        />
    );
};
