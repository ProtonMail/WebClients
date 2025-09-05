import { useEffect, useRef, useState } from 'react';

import { useParticipants } from '@livekit/components-react';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';

import './AutoCloseMeetingModal.scss';

interface AutoCloseMeetingModalProps {
    onLeave: () => void;
}

export const AutoCloseMeetingModal = ({ onLeave }: AutoCloseMeetingModalProps) => {
    const [timeAlone, setTimeAlone] = useState(0);
    const timeAloneRef = useRef(0);
    timeAloneRef.current = timeAlone;
    const autoCloseTimeInSeconds = 420; // 7 minutes
    const showAutoCloseAfterSeconds = 300; // 5 minutes

    const participants = useParticipants();

    useEffect(() => {
        setTimeAlone(0);
        if (participants.length === 1) {
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
    }, [participants.length]);

    return (
        <>
            {timeAlone >= showAutoCloseAfterSeconds && (
                <ModalTwo open={true} rootClassName="bg-transparent connection-lost-modal" className="meet-radius">
                    <ModalTwoContent
                        className="flex flex-column justify-space-between p-4 mx-4 pb-0 gap-4 text-center bg-norm pt-custom"
                        style={{ '--pt-custom': '3rem' }}
                    >
                        <div className="text-3xl text-semibold">{`Meeting will end in ${autoCloseTimeInSeconds - timeAlone} seconds`}</div>
                        <div className="color-weak">{c('meet_2025')
                            .t`Since you are the only participant in this meeting, the meeting will automatically close. Do you want to stay in this meeting?`}</div>

                        <div className="w-full flex flex-column gap-2 mt-4">
                            <Button
                                className="rounded-full color-invert reload-button py-4"
                                onClick={() => setTimeAlone(0)}
                                color="norm"
                                size="large"
                            >{c('meet_2025 Action').t`Stay in the meeting`}</Button>
                            <Button
                                className="rounded-full py-4 bg-weak close-button border-none"
                                onClick={onLeave}
                                color="weak"
                                size="large"
                            >
                                {c('meet_2025 Action').t`Leave meeting`}
                            </Button>
                        </div>
                    </ModalTwoContent>
                </ModalTwo>
            )}
        </>
    );
};
