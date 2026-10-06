import type { MouseEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';

import { getFeatureLines } from '../lib/features';
import type { OfferSurfaceProps } from './OfferSurface';

import './OfferDealModal.scss';

export interface OfferDealModalProps extends OfferSurfaceProps, Partial<ModalStateProps> {}

export const OfferDealModal = ({ offer, open = true, onClose, onExit }: OfferDealModalProps) => {
    const { campaign, onAction, onDismiss } = offer;
    const { message, cta } = campaign;

    if (!cta || !message.imageUrl) {
        return null;
    }

    const features = getFeatureLines(message.body);

    const handleAction = (event: MouseEvent<HTMLElement>) => {
        onAction(event);
        onClose?.();
    };

    const handleDismiss = () => {
        onDismiss();
        onClose?.();
    };

    return (
        <ModalTwo className="offer-deal-modal" size="large" open={open} onClose={onClose} onExit={onExit}>
            <ModalTwoContent>
                <Tooltip title={c('Action').t`Close`}>
                    <Button
                        className="offer-deal-close-button shrink-0 absolute right-0 top-0"
                        icon
                        shape="ghost"
                        onClick={onClose}
                    >
                        <IcCrossBig className="offer-deal-close-icon" size={3} alt={c('Action').t`Close`} />
                    </Button>
                </Tooltip>
                <div className="offer-deal-header">
                    <img
                        src={message.imageUrl}
                        referrerPolicy="no-referrer"
                        alt=""
                        aria-hidden={true}
                        className="offer-deal-image"
                        width={496}
                        height={339}
                    />
                    <div className="offer-deal-header-overlay" />
                    <div className="offer-deal-header-content">
                        <h1 className="offer-deal-title font-arizona">{message.title}</h1>
                    </div>
                </div>

                <div className="offer-deal-content">
                    <Button
                        size="large"
                        onClick={handleAction}
                        color="norm"
                        className="text-bold"
                        fullWidth
                        data-testid="offer-deal-modal:cta"
                    >
                        {cta.text}
                    </Button>

                    <ul className="offer-deal-features my-4">
                        {features.map((feature, index) => (
                            <li
                                key={`${index}:${feature}`}
                                className="py-2 px-3 flex flex-nowrap flex-row items-start gap-1"
                            >
                                <IcCheckmark className="shrink-0 mt-0.5" />
                                <span className="flex-1">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-column items-center gap-2 mt-4">
                        <span className="text-sm text-weak text-center">
                            {c('Info')
                                .t`Discounts are based on standard monthly pricing. Your subscription will renew at the standard annual rate when the billing cycle ends.`}
                        </span>
                        <Button
                            shape="underline"
                            size="small"
                            color="norm"
                            className="color-weak text-sm hover:color-weak"
                            onClick={handleDismiss}
                            data-testid="offer-deal-modal:dismiss"
                        >
                            {c('Action').t`Don't show this offer again`}
                        </Button>
                    </div>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};
