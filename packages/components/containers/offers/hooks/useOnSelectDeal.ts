import { useCallback } from 'react';

import { useSettingsLink } from '@proton/components/components';
import { Currency } from '@proton/shared/lib/interfaces';

import getOfferRedirectionParams from '../helpers/getOfferRedirectionParams';
import { Deal, Offer } from '../interface';

const useSelectDeal = (callback?: () => void) => {
    const goToSettingsLink = useSettingsLink();

    const handleOnSelectDeal = useCallback(
        (offer: Offer, deal: Deal, currency: Currency) => {
            const urlSearchParams = getOfferRedirectionParams({ offer, deal, currency });
            callback?.();
            goToSettingsLink(`/dashboard?${urlSearchParams.toString()}`);
        },
        [callback]
    );

    return handleOnSelectDeal;
};

export default useSelectDeal;
