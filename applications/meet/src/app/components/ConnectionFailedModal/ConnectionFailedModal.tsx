import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';

import './ConnectionFailedModal.scss';

interface ConnectionFailedModalProps {
    onTryAgain: () => void;
    onLeave?: () => void;
    showLeaveButton?: boolean;
}

export const ConnectionFailedModal = ({ onTryAgain, onLeave, showLeaveButton = true }: ConnectionFailedModalProps) => {
    const hasOnlyOneButton = !showLeaveButton || !onLeave;

    return (
        <ModalTwo
            open={true}
            rootClassName={`bg-transparent connection-failed-modal ${hasOnlyOneButton ? 'connection-failed-modal--single-button' : ''}`}
            className="meet-radius border border-norm"
        >
            <ModalTwoContent
                className="flex flex-column justify-space-between p-4 mx-4 pb-0 gap-4 text-center bg-norm pt-custom"
                style={{ '--pt-custom': '3rem' }}
            >
                <div className="text-3xl text-semibold">{c('Info').t`Connection failed`}</div>
                <div className="color-weak">{c('Info').t`Please try again or try another browser`}</div>

                <div className="w-full flex flex-column gap-2 mt-4">
                    <Button className="rounded-full reload-button py-4 border-none" onClick={onTryAgain} size="large">
                        {c('Action').t`Try again`}
                    </Button>

                    {showLeaveButton && onLeave && (
                        <Button
                            className="rounded-full py-4 bg-weak secondary border-none"
                            onClick={onLeave}
                            size="large"
                        >
                            {c('Action').t`Leave`}
                        </Button>
                    )}
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};
