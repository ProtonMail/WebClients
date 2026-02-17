import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

import { ScheduleMeetingForm } from '../ScheduleMeetingForm/ScheduleMeetingForm';
import { TranslucentModal } from '../TranslucentModal/TranslucentModal';

interface ScheduleMeetingModalProps {
    open: boolean;
    onClose: () => void;
    meeting?: Meeting;
    onMeetingCreated: (meetingId: string) => void;
}

export const ScheduleMeetingModal = ({ open, onClose, meeting, onMeetingCreated }: ScheduleMeetingModalProps) => {
    return (
        <TranslucentModal open={open} onClose={onClose}>
            <ScheduleMeetingForm meeting={meeting} open={open} onClose={onClose} onMeetingCreated={onMeetingCreated} />
        </TranslucentModal>
    );
};
