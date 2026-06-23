import { c } from 'ttag';

import { TopBanner } from '@proton/components/index';
import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectIsRecordingInProgress,
    selectRecordingParticipantNames,
} from '@proton/meet/store/slices/recordingStatusSlice';

export const RecordingTopBanner = () => {
    const isRecordingInProgress = useMeetSelector(selectIsRecordingInProgress);
    const recordingParticipantNames = useMeetSelector(selectRecordingParticipantNames);

    if (!isRecordingInProgress) {
        return null;
    }

    const getRecordingParticipantNamesMessage = () => {
        const participantName = recordingParticipantNames[0];
        const otherParticipantsCount = recordingParticipantNames.length - 1;

        if (recordingParticipantNames.length === 1) {
            return c('Info').jt`${participantName} is recording`;
        }

        return c('Info').jt`${participantName} and ${otherParticipantsCount} others are recording`;
    };

    return (
        // Visual-only: announced centrally by useRecordingAnnouncements.
        <TopBanner className="recording-in-progress-banner text-semibold" announce={false}>
            {c('Info').jt`Recording in progress`} · {getRecordingParticipantNamesMessage()}
        </TopBanner>
    );
};
