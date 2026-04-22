import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantIsHost } from '@proton/meet/store/slices/meetingInfo';
import { selectIsParticipantRecording } from '@proton/meet/store/slices/recordingStatusSlice';
import { selectIsParticipantScreenSharing } from '@proton/meet/store/slices/screenShareStatusSlice';
import { useFlag } from '@proton/unleash/useFlag';

const getParticipantStatusLabel = ({
    isHost,
    isScreenSharing,
    isRecording,
}: {
    isHost: boolean;
    isScreenSharing: boolean;
    isRecording: boolean;
}) => {
    let label = '';

    const addSeparator = () => {
        if (label) {
            label += ' · ';
        }
    };

    if (isHost) {
        label += c('Info').t`Host`;
    }

    if (isScreenSharing) {
        addSeparator();
        label += c('Info').t`Presenting`;
    }

    if (isRecording) {
        addSeparator();
        label += c('Info').t`Recording`;
    }

    return label;
};

export const ParticipantListItemStatus = ({ participantIdentity }: { participantIdentity: string }) => {
    const isMeetMultipleRecordingEnabled = useFlag('MeetMultipleRecording');

    const isRecording =
        useMeetSelector((state) => selectIsParticipantRecording(state, participantIdentity)) &&
        isMeetMultipleRecordingEnabled;
    const isHost = useMeetSelector((state) => selectParticipantIsHost(state, participantIdentity));
    const isScreenSharing = useMeetSelector((state) => selectIsParticipantScreenSharing(state, participantIdentity));

    if (!isRecording && !isHost && !isScreenSharing) {
        return null;
    }

    const label = getParticipantStatusLabel({
        isHost,
        isScreenSharing,
        isRecording,
    });

    return <div className="text-sm color-hint w-full">{label}</div>;
};
