import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { PassLogo } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';
import type { PaymentsCheckoutUI } from '@proton/payments/core/checkout';

import './OfferModal.scss';

type OfferModalProps = {
    checkoutUi: PaymentsCheckoutUI;
    loading: boolean;
    onClose: () => void;
    onContinue: (upgradeTo: boolean) => void;
};

export const OfferModal: FC<OfferModalProps> = ({ checkoutUi, loading, onClose, onContinue }) => {
    const renewalPrice = getSimplePriceString(checkoutUi.currency, checkoutUi.renewPrice);
    const offerPrice = getSimplePriceString(checkoutUi.currency, checkoutUi.withDiscountPerCycle);

    const features = [
        c('Label').t`Unlimited hide-my-email aliases`,
        c('Label').t`Built-in 2FA authenticator`,
        c('Label').t`Vault, item & secure link sharing`,
    ];

    return (
        <div className="modal-overlay fixed top-0 left-0 w-full h-full flex items-center justify-center rounded-lg">
            <div className="modal rounded-lg relative">
                <div className="relative bg-primary flex items-center justify-center py-2">
                    <div className="modal-title-container flex items-center">
                        <IcHourglass />
                        <span className="ml-1 text-bold">{c('Label').t`Special Offer!`}</span>
                    </div>
                    <Button className="absolute right-0" shape="ghost" icon pill onClick={onClose}>
                        <IcCross size={5} />
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
                                    - {checkoutUi.discountPercent}%
                                </span>
                                <span className="text-sm color-weak text-strike">{renewalPrice}</span>
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
                        onClick={() => onContinue(true)}
                        loading={loading}
                    >
                        {c('Action').t`Get limited-time offer`}
                    </Button>
                    <div className="flex flex-column gap-4 my-2">
                        <div className="text-bold">{c('Label').t`Get everything in Free, plus:`}</div>
                        {features.map((feature) => (
                            <div key={feature}>
                                <IcCheckmark className="mr-1" />
                                {feature}
                            </div>
                        ))}
                    </div>
                    <div className="color-weak my-6 text-center text-sm">
                        {c('Label').t`Renews at ${renewalPrice}, cancel anytime.`}
                    </div>
                    <Button
                        shape="ghost"
                        color="norm"
                        fullWidth
                        pill
                        onClick={() => onContinue(false)}
                        loading={loading}
                    >
                        {c('Action').t`No thanks`}
                    </Button>
                </div>
            </div>
        </div>
    );
};
