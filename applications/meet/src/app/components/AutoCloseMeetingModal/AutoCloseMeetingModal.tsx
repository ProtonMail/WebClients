import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface AutoCloseMeetingModalProps {
    participantCount: number;
    onLeave: () => void;
}

export const AutoCloseMeetingModal = ({ participantCount, onLeave }: AutoCloseMeetingModalProps) => {
    const [timeAlone, setTimeAlone] = useState(0);
    const timeAloneRef = useRef(0);
    timeAloneRef.current = timeAlone;
    const autoCloseTimeInSeconds = 420; // 7 minutes
    const showAutoCloseAfterSeconds = 300; // 5 minutes

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
    }, [participantCount]);

    function formatCountDown(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        const secsStr = secs.toString().padStart(2, '0');
        return `${mins}:${secsStr}`;
    }

    const timeLeft = (
        <span key="time-left" className="text-tabular-nums">
            {formatCountDown(autoCloseTimeInSeconds - timeAlone)}
        </span>
    );

    return (
        timeAlone >= showAutoCloseAfterSeconds && (
            <ConfirmationModal
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
