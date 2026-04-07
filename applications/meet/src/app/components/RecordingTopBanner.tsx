import { c } from 'ttag';

import { TopBanner } from '@proton/components/index';
import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectIsRecordingInProgress,
    selectRecordingParticipantNames,
} from '@proton/meet/store/slices/recordingStatusSlice';
import { useFlag } from '@proton/unleash/useFlag';

export const RecordingTopBanner = () => {
    const isMeetMultipleRecordingEnabled = useFlag('MeetMultipleRecording');

    const isRecordingInProgress = useMeetSelector(selectIsRecordingInProgress);
    const recordingParticipantNames = useMeetSelector(selectRecordingParticipantNames);

    if (!isRecordingInProgress) {
        return null;
    }

    // Clean up with MeetMultipleRecording ff cleanup
    if (!isMeetMultipleRecordingEnabled) {
        return (
            <TopBanner className="recording-in-progress-banner text-semibold">
                {c('Info').jt`Recording in progress`}
            </TopBanner>
        );
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
        <TopBanner className="recording-in-progress-banner text-semibold">
            {c('Info').jt`Recording in progress`} · {getRecordingParticipantNamesMessage()}
        </TopBanner>
    );
};
