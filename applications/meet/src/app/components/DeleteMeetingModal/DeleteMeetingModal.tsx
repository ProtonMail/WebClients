import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcCross } from '@proton/icons/icons/IcCross';
import { useDeleteMeeting } from '@proton/meet/hooks/useDeleteMeeting';
import { useGetMeetings } from '@proton/meet/store/hooks/useMeetings';
import { CacheType } from '@proton/redux-utilities/asyncModelThunk/interface';

import './DeleteMeetingModal.scss';

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
        <ModalTwo
            open={true}
            rootClassName="bg-transparent delete-meeting-modal"
            className="meet-radius border border-norm"
        >
            <Button
                onClick={onClose}
                className="absolute top-custom right-custom rounded-full w-custom h-custom shrink-0 p-0 border-none"
                style={{
                    '--top-custom': '0.75rem',
                    '--right-custom': '0.75rem',
                }}
                shape="ghost"
                size="small"
            >
                <IcCross className="color-hint" size={5} alt={c('Action').t`Close`} />
            </Button>
            <div
                className="flex flex-column justify-end items-center gap-4 text-center bg-norm h-full p-6 pt-custom overflow-hidden"
                style={{ '--pt-custom': '5rem' }}
            >
                <div className="text-3xl text-semibold">
                    {isRoom ? c('Info').t`Delete room` : c('Info').t`Delete event`}
                </div>
                <div className="color-weak">
                    {isRoom
                        ? c('Info').t`Would you like to delete this room?`
                        : c('Info').t`Would you like to delete this event?`}
                </div>

                <div className="w-full flex flex-column gap-2 mt-4">
                    <Button
                        className="delete-meeting-button rounded-full color-invert py-4 text-semibold"
                        onClick={handleClick}
                        color="norm"
                        size="large"
                    >{c('Action').t`Delete`}</Button>

                    <Button
                        className="action-button-new rounded-full py-4 bg-weak border-none text-semibold border"
                        onClick={onClose}
                        color="weak"
                        size="large"
                    >
                        {c('Action').t`Cancel`}
                    </Button>
                </div>
            </div>
        </ModalTwo>
    );
};
