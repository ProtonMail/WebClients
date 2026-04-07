import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectIsLocalParticipantRecording,
    selectIsRecordingInProgress,
} from '@proton/meet/store/slices/recordingStatusSlice';
import IcCircleRadioFilled from '@proton/styles/assets/img/meet/ic-circle-radio-filled.svg';

import { useMeetContext } from '../../contexts/MeetContext';
import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

export const RecordingInProgressModal = () => {
    const isRecordingInProgress = useMeetSelector(selectIsRecordingInProgress);
    const isLocalParticipantRecording = useMeetSelector(selectIsLocalParticipantRecording);
    const prevIsRecordingInProgressRef = useRef<boolean | null>(null);

    const { handleLeave } = useMeetContext();

    const [isRecordingInProgressModalOpen, setIsRecordingInProgressModalOpen] = useState(false);

    useEffect(() => {
        if (isRecordingInProgress !== prevIsRecordingInProgressRef.current) {
            setIsRecordingInProgressModalOpen(isRecordingInProgress && !isLocalParticipantRecording);
        }

        prevIsRecordingInProgressRef.current = isRecordingInProgress;
    }, [isRecordingInProgress, isLocalParticipantRecording]);

    if (!isRecordingInProgressModalOpen) {
        return null;
    }

    return (
        <ConfirmationModal
            icon={
                <img
                    src={IcCircleRadioFilled}
                    alt=""
                    className="w-custom h-custom"
                    style={{ '--w-custom': '4.5em', '--h-custom': '4.5em' }}
                />
            }
            title={c('Info').t`This meeting is being recorded`}
            message={c('Info').t`By continuing in the meeting, you acknowledge and consent to being recorded.`}
            primaryText={c('Action').t`Continue`}
            onPrimaryAction={() => setIsRecordingInProgressModalOpen(false)}
            secondaryText={c('Action').t`Leave meeting`}
            secondaryButtonClass="secondary"
            onSecondaryAction={handleLeave}
        />
    );
};
