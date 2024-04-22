import { useCallback } from 'react';

import { useSettingsLink } from '@proton/components/components';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { Currency } from '@proton/shared/lib/interfaces';

import { openLinkInBrowser } from '../../desktop/openExternalLink';
import getOfferRedirectionParams from '../helpers/getOfferRedirectionParams';
import { Deal, Offer } from '../interface';

const useSelectDeal = (callback?: () => void) => {
    const goToSettingsLink = useSettingsLink();

    const handleOnSelectDeal = useCallback(
        (offer: Offer, deal: Deal, currency: Currency) => {
            const urlSearchParams = getOfferRedirectionParams({ offer, deal, currency });
            callback?.();

            const url = `/dashboard?${urlSearchParams.toString()}`;
            if (isElectronApp && !hasInboxDesktopFeature('InAppPayments')) {
                openLinkInBrowser(getAppHref(url, APPS.PROTONACCOUNT));
                return;
            } else {
                goToSettingsLink(url);
            }
        },
        [callback]
    );

    return handleOnSelectDeal;
};

export default useSelectDeal;
