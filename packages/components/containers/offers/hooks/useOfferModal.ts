import { useState } from 'react';

import { useModalState } from '@proton/components/components';
import { useUser } from '@proton/components/hooks';
import { DEFAULT_CURRENCY } from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';

import { OfferConfig } from '../interface';
import useFetchOffer from './useFetchOffer';

const useOfferModal = (offerConfig: OfferConfig) => {
    const [user] = useUser();
    const [offerModalProps, setOfferModalOpen, renderOfferModal] = useModalState();
    const [fetchOffer, setFetchOffer] = useState(false);
    const defaultCurrency = user?.Currency || DEFAULT_CURRENCY;
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
