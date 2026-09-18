import type { MouseEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import type { OfferSurfaceProps } from './OfferSurface';

export const OfferModal = ({ offer, open = true, onClose, onExit }: OfferSurfaceProps & Partial<ModalStateProps>) => {
    const { campaign, onAction, onDismiss, seenRef } = offer;
    const { message, cta } = campaign;

    const handleClose = () => {
        onDismiss();
        onClose?.();
    };

    const handleAction = (event: MouseEvent<HTMLElement>) => {
        onAction(event);
        onClose?.();
    };

    return (
        <ModalTwo className="overflow-auto" size="small" onClose={handleClose} onExit={onExit} open={open}>
            <ModalTwoHeader
                className="w-full"
                hasClose={false}
                title={<span ref={seenRef}>{message.title}</span>}
                titleClassName="text-center"
                subline={
                    <div className="flex items-center justify-center gap-5 mt-2">
                        {message.imageUrl && (
                            <img
                                className="mt-2 rounded-lg pointer-events-none user-select-none w-full max-w-full"
                                src={message.imageUrl}
                                referrerPolicy="no-referrer"
                                alt=""
                            />
                        )}
                        <span className="text-weak text-center w-full">{message.body}</span>
                    </div>
                }
            />

            <ModalTwoFooter className="flex flex-column items-stretch text-center gap-1">
                {cta && (
                    <Button
                        className="text-ellipsis"
                        color="norm"
                        shape="solid"
                        fullWidth
                        onClick={handleAction}
                        pill
                        data-testid="offer-modal:cta"
                    >
                        {cta.text}
                    </Button>
                )}

                <Button color="weak" shape="solid" onClick={handleClose} pill>
                    {c('Action').t`Not now`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
