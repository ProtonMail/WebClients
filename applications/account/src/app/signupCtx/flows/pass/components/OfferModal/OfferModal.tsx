import { type FC, useId } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/src';
import { Icon, PassLogo } from '@proton/components';
import { MaybeNull } from '@proton/pass/types';
import { PLANS } from '@proton/payments/core/constants';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import './OfferModal.scss';

const OFFER_DISCOUNT_PERCENTAGE = 80;

export type OfferContinueAction = { upgradeTo: MaybeNull<PLANS> };

type OfferModalProps = {
    rawPrice: number;
    getPrice: (price: number) => string;
    onClose: () => void;
    onContinue: (params: OfferContinueAction) => void;
};

export const OfferModal: FC<OfferModalProps> = ({ rawPrice, getPrice, onClose, onContinue }) => {
    const id = useId();
    const price = getPrice(rawPrice);
    const offerPrice = getPrice(rawPrice * (1 - OFFER_DISCOUNT_PERCENTAGE / 100));

    const features = [
        c('Label').t`Unlimited Hide-my-email aliases`,
        c('Label').t`Vault, item & secure link sharing`,
        c('Label').t`Dark Web Monitoring`,
    ];

    return (
        <div className="modal-overlay fixed top-0 left-0 w-full h-full flex items-center justify-center rounded-lg">
            <div className="modal rounded-lg relative">
                <div className="relative bg-primary flex items-center justify-center py-2">
                    <div className="modal-title-container">
                        <Icon name="hourglass" />
                        <span className="ml-1 text-bold">{c('Label')
                            .t`Special Offer: Get ${PASS_SHORT_APP_NAME} Plus for ${offerPrice}`}</span>
                    </div>
                    <Button className="absolute right-0" shape="ghost" icon pill onClick={onClose}>
                        <Icon name="cross" size={5} />
                    </Button>
                </div>
                <div className="py-4 px-6">
                    <div className="flex flex-column items-center">
                        <div className="flex flex-column items-center">
                            <PassLogo variant="glyph-only" size={7} />
                            <span className="text-xl text-bold">Plus</span>
                        </div>
                        <div className="flex gap-4 items-center mt-2">
                            <h1 className="text-40 text-bold">{offerPrice}</h1>
                            <div className="flex flex-column items-center">
                                <span className="badge rounded-full py-0.5 px-1 text-sm">
                                    - ${OFFER_DISCOUNT_PERCENTAGE}%
                                </span>
                                <span className="text-sm color-weak text-strike">{price}</span>
                            </div>
                        </div>
                        <div className="color-weak text-sm">{c('Label').t`for your first month`}</div>
                    </div>
                    <Button
                        className="my-6"
                        size="large"
                        color="norm"
                        fullWidth
                        pill
                        onClick={() => onContinue({ upgradeTo: PLANS.PASS })}
                    >
                        {c('Action').t`Get limited-time offer`}
                    </Button>
                    <div className="flex flex-column gap-4 my-2">
                        <div className="text-bold">{c('Label').t`Get everything in Free, plus:`}</div>
                        {features.map((feature) => (
                            <div key={`${id}-${feature}`}>
                                <Icon name="checkmark" className="mr-1" />
                                {feature}
                            </div>
                        ))}
                    </div>
                    <div className="color-weak my-6 text-center text-sm">{c('Label')
                        .t`Renews at ${price}, cancel anytime.`}</div>
                    <Button shape="ghost" color="norm" fullWidth pill onClick={() => onContinue({ upgradeTo: null })}>
                        {c('Action').t`No thanks`}
                    </Button>
                </div>
            </div>
        </div>
    );
};
