import { TopBanner } from '@proton/components/index';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsRecordingInProgress } from '@proton/meet/store/slices/recordingStatusSlice';
import {
    dismissParticipantCountMismatchBanner,
    selectParticipantCountMismatchBannerDismissed,
} from '@proton/meet/store/slices/uiStateSlice';
import { selectWaitingParticipantsCount } from '@proton/meet/store/slices/waitingRoomSlice';
import clsx from '@proton/utils/clsx';

import { MismatchStage, useMismatchStage } from '../../hooks/useMismatchStage';
import { ParticipantCountMismatchTopBanner } from './ParticipantCountMismatchTopBanner';
import { RecordingTopBanner } from './RecordingTopBanner';
import { WaitingRoomTopBanner } from './WaitingRoomTopBanner';

export const MeetingTopBanner = () => {
    const dispatch = useMeetDispatch();
    const isRecordingInProgress = useMeetSelector(selectIsRecordingInProgress);
    const waitingRoomParticipantsCount = useMeetSelector(selectWaitingParticipantsCount);
    const isCountMismatchDismissed = useMeetSelector(selectParticipantCountMismatchBannerDismissed);
    const isCountMismatchWarning = useMismatchStage() === MismatchStage.Warning && !isCountMismatchDismissed;

    if (!isRecordingInProgress && !waitingRoomParticipantsCount && !isCountMismatchWarning) {
        return null;
    }

    const getTopBannerMessage = () => {
        if (isRecordingInProgress && waitingRoomParticipantsCount && isCountMismatchWarning) {
            return (
                <div className="flex flex-nowrap gap-2 items-center justify-center">
                    <RecordingTopBanner />
                    <span>|</span>
                    <WaitingRoomTopBanner waitingRoomParticipantsCount={waitingRoomParticipantsCount} />
                    <span>|</span>
                    <ParticipantCountMismatchTopBanner />
                </div>
            );
        }

        if (isRecordingInProgress && waitingRoomParticipantsCount) {
            return (
                <div className="flex flex-nowrap gap-2 items-center justify-center">
                    <RecordingTopBanner />
                    <span>|</span>
                    <WaitingRoomTopBanner waitingRoomParticipantsCount={waitingRoomParticipantsCount} />
                </div>
            );
        }

        if (isRecordingInProgress && isCountMismatchWarning) {
            return (
                <div className="flex flex-nowrap gap-2 items-center justify-center">
                    <RecordingTopBanner />
                    <span>|</span>
                    <ParticipantCountMismatchTopBanner />
                </div>
            );
        }

        if (waitingRoomParticipantsCount && isCountMismatchWarning) {
            return (
                <div className="flex flex-nowrap gap-2 items-center justify-center">
                    <WaitingRoomTopBanner waitingRoomParticipantsCount={waitingRoomParticipantsCount} />
                    <span>|</span>
                    <ParticipantCountMismatchTopBanner />
                </div>
            );
        }

        if (isRecordingInProgress) {
            return <RecordingTopBanner />;
        }

        if (waitingRoomParticipantsCount) {
            return <WaitingRoomTopBanner waitingRoomParticipantsCount={waitingRoomParticipantsCount} />;
        }

        if (isCountMismatchWarning) {
            return <ParticipantCountMismatchTopBanner />;
        }
    };

    return (
        // Visual-only: announced centrally by useRecordingAnnouncements.
        <TopBanner
            className={clsx(
                'meeting-top-banner text-semibold',
                isCountMismatchWarning && 'meeting-top-banner--warning'
            )}
            announce={false}
            // Only the mismatch notice is dismissable; recording and waiting room must stay visible.
            onClose={isCountMismatchWarning ? () => dispatch(dismissParticipantCountMismatchBanner()) : undefined}
        >
            {getTopBannerMessage()}
        </TopBanner>
    );
};
