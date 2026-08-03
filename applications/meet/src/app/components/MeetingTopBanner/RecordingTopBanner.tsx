import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectRecordingParticipantNames } from '@proton/meet/store/slices/recordingStatusSlice';

export const RecordingTopBanner = () => {
    const recordingParticipantNames = useMeetSelector(selectRecordingParticipantNames);

    const getRecordingParticipantNamesMessage = () => {
        const participantName = recordingParticipantNames[0];
        const otherParticipantsCount = recordingParticipantNames.length - 1;

        if (recordingParticipantNames.length === 1) {
            return c('Info').t`${participantName} is recording`;
        }

        return c('Info').t`${participantName} and ${otherParticipantsCount} others are recording`;
    };

    return `${c('Info').t`Recording in progress`} · ${getRecordingParticipantNamesMessage()}`;
};
