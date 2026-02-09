import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

import { ScheduleMeetingForm } from '../ScheduleMeetingForm/ScheduleMeetingForm';
import { TranslucentModal } from '../TranslucentModal/TranslucentModal';

interface ScheduleMeetingModalProps {
    open: boolean;
    onClose: () => void;
    meeting?: Meeting;
}

export const ScheduleMeetingModal = ({ open, onClose, meeting }: ScheduleMeetingModalProps) => {
    return (
        <TranslucentModal open={open} onClose={onClose}>
            <ScheduleMeetingForm meeting={meeting} open={open} onClose={onClose} />
        </TranslucentModal>
    );
};
