import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import scheduleIcon from '@proton/styles/assets/img/meet/schedule-icon.png';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { useMeetContext } from '../../contexts/MeetContext';

import './RecordingInProgressModal.scss';

export const RecordingInProgressModal = () => {
    const { isRecordingInProgress } = useMeetContext();
    const prevIsRecordingInProgressRef = useRef<boolean | null>(null);

    const { handleLeave } = useMeetContext();

    const [isRecordingInProgressModalOpen, setIsRecordingInProgressModalOpen] = useState(false);

    useEffect(() => {
        if (isRecordingInProgress !== prevIsRecordingInProgressRef.current) {
            setIsRecordingInProgressModalOpen(isRecordingInProgress);
        }

        prevIsRecordingInProgressRef.current = isRecordingInProgress;
    }, [isRecordingInProgress]);

    if (!isRecordingInProgressModalOpen) {
        return null;
    }

    return (
        <ModalTwo
            open={true}
            rootClassName="bg-transparent recording-in-progress-modal"
            className="meet-radius border border-norm"
        >
            <div
                className="flex flex-column justify-end items-center gap-4 text-center bg-norm h-full p-6 pt-custom overflow-hidden"
                style={{ '--pt-custom': '5rem' }}
            >
                <CloseButton
                    onClose={() => setIsRecordingInProgressModalOpen(false)}
                    className="absolute top-custom right-custom"
                    style={{ '--top-custom': '0.75rem', '--right-custom': '0.75rem' }}
                />
                <img
                    className="w-custom h-custom mb-2"
                    src={scheduleIcon}
                    alt=""
                    style={{ '--w-custom': '4rem', '--h-custom': '4rem' }}
                />

                <div className="text-3xl text-semibold">{c('Info').t`This meeting is being recorded`}</div>
                <div className="color-weak">{c('Info')
                    .t`By continuing in the meeting, you acknowledge and consent to being recorded.`}</div>

                <div className="flex flex-column gap-2 w-full">
                    <Button
                        className="continue-button rounded-full py-4 px-6 color-invert font-semibold border-none"
                        onClick={() => setIsRecordingInProgressModalOpen(false)}
                        color="norm"
                    >{c('Action').t`Continue`}</Button>
                    <Button
                        className="leave-button rounded-full py-4 px-6 color-weak font-semibold border-none"
                        onClick={handleLeave}
                        color="weak"
                    >{c('Action').t`Leave meeting`}</Button>
                </div>
            </div>
        </ModalTwo>
    );
};
