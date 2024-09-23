import { useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import type { Currency } from '@proton/shared/lib/interfaces';

import type { OfferConfig } from '../interface';
import useFetchOffer from './useFetchOffer';

const useOfferModal = (offerConfig: OfferConfig) => {
    const [offerModalProps, setOfferModalOpen, renderOfferModal] = useModalState();
    const [fetchOffer, setFetchOffer] = useState(false);
    const defaultCurrency = useAutomaticCurrency();
    const [currency, setCurrency] = useState<Currency>(defaultCurrency);

    const [offer, loadingOffer] = useFetchOffer({
        offerConfig: fetchOffer ? offerConfig : undefined,
        currency,
        onError: () => {
            // This is like a retry. Resetting the offer config so that the calls get retried if the user clicks the button again.
            setFetchOffer(false);
        },
    });

    return {
        offer,
        currency,
        loadingOffer,
        renderOfferModal,
        offerModalProps,
        onChangeCurrency: setCurrency,
        setOfferModalOpen,
        setFetchOffer,
    };
};

export default useOfferModal;
