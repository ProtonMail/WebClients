import { c } from 'ttag';

import { Button } from '@proton/atoms';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';

import './ConnectionLostModal.scss';

interface ConnectionLostModalProps {
    onClose: () => void;
}

export const ConnectionLostModal = ({ onClose }: ConnectionLostModalProps) => {
    return (
        <ModalTwo open={true} rootClassName="bg-transparent connection-lost-modal" className="meet-radius">
            <ModalTwoContent
                className="flex flex-column justify-space-between p-4 mx-4 pb-0 gap-4 text-center bg-norm pt-custom"
                style={{ '--pt-custom': '3rem' }}
            >
                <div className="text-3xl text-semibold">{c('Info').t`Connection lost`}</div>
                <div className="color-weak">{c('Info').t`Connection lost, please join meeting again`}</div>

                <div className="w-full flex flex-column gap-2 mt-4">
                    <Button
                        className="rounded-full color-invert reload-button py-4"
                        onClick={() => window.location.reload()}
                        color="norm"
                        size="large"
                    >{c('Action').t`OK`}</Button>

                    <Button
                        className="rounded-full py-4 bg-weak close-button border-none"
                        onClick={onClose}
                        color="weak"
                        size="large"
                    >
                        {c('Action').t`Close`}
                    </Button>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};
