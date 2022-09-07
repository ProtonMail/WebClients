import { useState } from 'react';

import { CircleLoader, ModalProps, ModalTwo, ModalTwoContent, ModalTwoHeader, useUser } from '@proton/components';
import { DEFAULT_CURRENCY } from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import useFetchOffer from '../hooks/useFetchOffer';
import useOnSelectDeal from '../hooks/useOnSelectDeal';
import useVisitedOffer from '../hooks/useVisitedOffer';
import { OfferConfig } from '../interface';
import ProtonLogos from './ProtonLogos';

import '../Offer.scss';

interface Props extends ModalProps {
    offerConfig: OfferConfig;
    modalProps: ModalProps;
}

const OfferModal = ({ offerConfig, modalProps }: Props) => {
    useVisitedOffer(offerConfig);
    const [user] = useUser();
    const defaultCurrency = user?.Currency || DEFAULT_CURRENCY;
    const [currency, updateCurrency] = useState<Currency>(defaultCurrency);
    const { onClose: handleCloseModal } = modalProps;

    const offer = useFetchOffer({
        offerConfig,
        currency: defaultCurrency,
        onError: handleCloseModal,
    });

    const handleOnSelectDeal = useOnSelectDeal(handleCloseModal);

    return (
        <ModalTwo className="offer-modal" {...modalProps} size={offerConfig.deals.length > 1 ? 'large' : 'medium'}>
            <ModalTwoHeader title={<ProtonLogos />} />
            <ModalTwoContent>
                {!offer ? (
                    <div className="text-center">
                        <CircleLoader size="large" className="mxauto flex mb2" />
                    </div>
                ) : (
                    <offer.layout
                        offer={offer}
                        currency={currency}
                        onChangeCurrency={updateCurrency}
                        onSelectDeal={handleOnSelectDeal}
                        onCloseModal={handleCloseModal || noop}
                    />
                )}
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default OfferModal;
