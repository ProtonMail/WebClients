import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import warningImg from '@proton/styles/assets/img/meet/warning-icon.png';

import './EndMeetingWarningModal.scss';

interface EndMeetingWarningModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

export const EndMeetingWarningModal = ({ onClose, onConfirm }: EndMeetingWarningModalProps) => {
    return (
        <ModalTwo open={true} rootClassName="bg-transparent open-link-modal" className="meet-radius border border-norm">
            <div
                className="flex flex-column justify-end items-center gap-4 text-center bg-norm h-full p-6 pt-custom overflow-hidden"
                style={{ '--pt-custom': '5rem' }}
            >
                <img
                    className="w-custom h-custom mb-2"
                    src={warningImg}
                    alt=""
                    style={{ '--w-custom': '7.5rem', '--h-custom': '7.5rem' }}
                />

                <div className="text-3xl text-semibold">{c('Info').t`End Meeting for everyone?`}</div>
                <div className="text-lg text-semibold">{c('Info')
                    .t`This will end the meeting for all participants.`}</div>

                <div className="w-full flex flex-column gap-2 mt-4">
                    <Button
                        className="end-meeting-warning-button rounded-full reload-button py-4 text-semibold"
                        onClick={onConfirm}
                        color="norm"
                        size="large"
                    >{c('Action').t`End meeting`}</Button>

                    <Button
                        className="rounded-full py-4 bg-weak close-button border-none text-semibold"
                        onClick={onClose}
                        color="weak"
                        size="large"
                    >
                        {c('Action').t`Cancel`}
                    </Button>
                </div>
            </div>
        </ModalTwo>
    );
};
