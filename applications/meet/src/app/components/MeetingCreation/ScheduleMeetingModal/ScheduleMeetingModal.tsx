import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

import { TranslucentModal } from '../../TranslucentModal/TranslucentModal';
import { getMeetingVariantFromId } from '../shared/getMeetingVariantFromId';
import { ScheduleMeetingForm } from './ScheduleMeetingForm/ScheduleMeetingForm';

interface ScheduleMeetingModalProps {
    open: boolean;
    onClose: () => void;
    meeting?: Meeting;
    onMeetingCreated: (meetingId: string) => void;
}

export const ScheduleMeetingModal = ({ open, onClose, meeting, onMeetingCreated }: ScheduleMeetingModalProps) => {
    return (
        <TranslucentModal open={open} onClose={onClose}>
            <ScheduleMeetingForm
                variant={getMeetingVariantFromId(meeting?.ID)}
                meeting={meeting}
                open={open}
                onClose={onClose}
                onMeetingCreated={onMeetingCreated}
            />
        </TranslucentModal>
    );
};
