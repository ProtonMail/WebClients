import { useEffect, useState } from 'react';

import type { Currency } from '@proton/payments/core/interface';

import useModalState from '../../../components/modalTwo/useModalState';
import { useAutomaticCurrency } from '../../../payments/client-extensions/index';
import type { OfferConfig } from '../interface';
import useFetchOffer from './useFetchOffer';

const useOfferModal = (offerConfig: OfferConfig, shouldPrefetch = false) => {
    const [offerModalProps, setOfferModalOpen, renderOfferModal] = useModalState();
    const [fetchOffer, setFetchOffer] = useState(false);
    const [automaticCurrency, loadingCurrency] = useAutomaticCurrency();
    const [controlledCurrency, setCurrency] = useState<Currency | undefined>();
    const currency = controlledCurrency ?? automaticCurrency;

    useEffect(() => {
        if (!loadingCurrency) {
            setCurrency(automaticCurrency);
        }
    }, [automaticCurrency, loadingCurrency]);

    const {
        offer,
        loading: loadingOffer,
        hasEstimationError,
        initialized,
    } = useFetchOffer({
        offerConfig: fetchOffer || shouldPrefetch ? offerConfig : undefined,
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
        hasEstimationError,
        initialized,
    };
};

export default useOfferModal;
