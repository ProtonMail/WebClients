import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import type { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import useOnSelectDeal from '../hooks/useOnSelectDeal';
import useVisitedOffer from '../hooks/useVisitedOffer';
import type { Offer, OfferConfig, OfferProps } from '../interface';
import OfferCloseButton from './shared/OfferCloseButton';

import '../Offer.scss';

interface Props {
    offerConfig: OfferConfig;
    offer: Offer;
    modalProps: ModalProps;
    currency: Currency;
    onChangeCurrency: (currency: Currency) => void;
    onSelectDeal?: OfferProps['onSelectDeal'];
}

const OfferModal = ({ offer, offerConfig, modalProps, currency, onChangeCurrency, onSelectDeal }: Props) => {
    useVisitedOffer(offerConfig);
    const { onClose: handleCloseModal } = modalProps;

    const handleOnSelectDeal = useOnSelectDeal(handleCloseModal);

    return (
        <ModalTwo
            className={clsx(
                'offer-modal',
                `offer-${offerConfig.ID}`,
                offerConfig.deals.length < 2 && 'offer-modal--one-deal',
                offerConfig.deals.length > 3 && 'offer-modal--four-deals'
            )}
            {...modalProps}
            size="large"
        >
            <ModalTwoContent>
                {modalProps.onClose && (
                    <OfferCloseButton onClose={modalProps.onClose} darkBackground={offer.darkBackground} />
                )}
                <offerConfig.layout
                    offer={offer}
                    currency={currency}
                    onChangeCurrency={onChangeCurrency}
                    onSelectDeal={onSelectDeal || handleOnSelectDeal}
                    onCloseModal={handleCloseModal || noop}
                />
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default OfferModal;
