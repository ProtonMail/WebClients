import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import warningImg from '@proton/styles/assets/img/meet/warning-icon.png';

import './LeaveMeetingWarningModal.scss';

interface LeaveMeetingWarningModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

export const LeaveMeetingWarningModal = ({ onClose, onConfirm }: LeaveMeetingWarningModalProps) => {
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

                <div className="text-3xl text-semibold">{c('Info').t`Are you sure you want to leave?`}</div>

                <div className="w-full flex flex-column gap-2 mt-4">
                    <Button
                        className="leave-warning-button rounded-full reload-button py-4 text-semibold"
                        onClick={onConfirm}
                        color="norm"
                        size="large"
                    >{c('Action').t`Leave meeting`}</Button>

                    <Button
                        className="rounded-full py-4 bg-weak secondary border-none text-semibold"
                        onClick={onClose}
                        size="large"
                    >
                        {c('Action').t`Stay in meeting`}
                    </Button>
                </div>
            </div>
        </ModalTwo>
    );
};
