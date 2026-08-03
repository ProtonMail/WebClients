import { TopBanner } from '@proton/components/index';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsRecordingInProgress } from '@proton/meet/store/slices/recordingStatusSlice';
import { selectWaitingParticipantsCount } from '@proton/meet/store/slices/waitingRoomSlice';

import { RecordingTopBanner } from './RecordingTopBanner';
import { WaitingRoomTopBanner } from './WaitingRoomTopBanner';

export const MeetingTopBanner = () => {
    const isRecordingInProgress = useMeetSelector(selectIsRecordingInProgress);
    const waitingRoomParticipantsCount = useMeetSelector(selectWaitingParticipantsCount);

    if (!isRecordingInProgress && !waitingRoomParticipantsCount) {
        return null;
    }

    const getTopBannerMessage = () => {
        if (isRecordingInProgress && waitingRoomParticipantsCount) {
            return (
                <div className="flex flex-nowrap gap-2 items-center justify-center">
                    <RecordingTopBanner />
                    <span>|</span>
                    <WaitingRoomTopBanner waitingRoomParticipantsCount={waitingRoomParticipantsCount} />
                </div>
            );
        }

        if (isRecordingInProgress) {
            return <RecordingTopBanner />;
        }

        if (waitingRoomParticipantsCount) {
            return <WaitingRoomTopBanner waitingRoomParticipantsCount={waitingRoomParticipantsCount} />;
        }
    };

    return (
        // Visual-only: announced centrally by useRecordingAnnouncements.
        <TopBanner className="meeting-top-banner text-semibold" announce={false}>
            {getTopBannerMessage()}
        </TopBanner>
    );
};
