import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { MINUTE } from '@proton/shared/lib/constants';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';
import { announcementMessages } from '../MeetingAnnouncer/messages';
import { AnnouncementPriority } from '../MeetingAnnouncer/types';
import { useAnnounce } from '../MeetingAnnouncer/useAnnounce';

interface AutoCloseMeetingModalProps {
    participantCount: number;
    onLeave: () => void;
}

const showAutoCloseAfterSeconds = 30 * MINUTE;
const autoCloseTimeInSeconds = showAutoCloseAfterSeconds + 2 * MINUTE;

// Seconds remaining, high → low. First message carries the context; the rest are terse.
const ANNOUNCEMENT_THRESHOLDS: { secondsLeft: number; message: () => string }[] = [
    {
        secondsLeft: autoCloseTimeInSeconds - showAutoCloseAfterSeconds,
        message: announcementMessages.autoCloseDisplayed,
    },
    { secondsLeft: 60, message: announcementMessages.autoCloseIn1Minute },
    { secondsLeft: 30, message: announcementMessages.autoCloseIn30Seconds },
    { secondsLeft: 15, message: announcementMessages.autoCloseIn15Seconds },
];

export const AutoCloseMeetingModal = ({ participantCount, onLeave }: AutoCloseMeetingModalProps) => {
    const announce = useAnnounce();

    const [timeAlone, setTimeAlone] = useState(0);
    const timeAloneRef = useRef(0);
    timeAloneRef.current = timeAlone;

    const firedThresholdsRef = useRef<Set<number>>(new Set());

    const isShown = timeAlone >= showAutoCloseAfterSeconds;

    useEffect(() => {
        setTimeAlone(0);
        if (participantCount === 1) {
            const intervalId = setInterval(async () => {
                if (timeAloneRef.current >= autoCloseTimeInSeconds) {
                    clearInterval(intervalId);
                    onLeave();
                    return;
                }
                setTimeAlone((prev) => prev + 1); // 1_000 ms = 1s
            }, 1_000);

            return () => clearInterval(intervalId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [participantCount]);

    useEffect(() => {
        // Reset while hidden so a fresh countdown (e.g. after choosing to stay) announces again.
        if (!isShown) {
            firedThresholdsRef.current.clear();
            return;
        }

        const secondsLeft = autoCloseTimeInSeconds - timeAlone;
        for (const { secondsLeft: threshold, message } of ANNOUNCEMENT_THRESHOLDS) {
            if (secondsLeft <= threshold && !firedThresholdsRef.current.has(threshold)) {
                firedThresholdsRef.current.add(threshold);
                announce(message(), { dedupeKey: `auto-close-${threshold}`, priority: AnnouncementPriority.High });
                break;
            }
        }
    }, [timeAlone, isShown, announce]);

    function formatCountDown(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        const secsStr = secs.toString().padStart(2, '0');
        return `${mins}:${secsStr}`;
    }

    const timeLeft = (
        <span key="time-left" className="text-tabular-nums" aria-hidden="true">
            {formatCountDown(autoCloseTimeInSeconds - timeAlone)}
        </span>
    );

    return (
        isShown && (
            <ConfirmationModal
                // Announced via the live region (threshold effect above). Opt out of the focus trap
                // so the dialog doesn't steal focus / auto-announce itself and swallow that
                // announcement (mirrors RecordingInProgressModal).
                enableFocusTrap={false}
                title={c('Info').jt`Meeting will end in ${timeLeft}`}
                message={c('meet_2025')
                    .t`Since you are the only participant in this meeting, the meeting will automatically close. Do you want to stay in this meeting?`}
                primaryText={c('meet_2025 Action').t`Stay in the meeting`}
                primaryButtonClass="secondary"
                onPrimaryAction={() => setTimeAlone(0)}
                secondaryText={c('meet_2025 Action').t`Leave meeting`}
                secondaryButtonClass="danger"
                onSecondaryAction={onLeave}
            />
        )
    );
};
