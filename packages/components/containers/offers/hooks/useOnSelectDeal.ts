import { useCallback } from 'react';

import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import type { Currency } from '@proton/shared/lib/interfaces';

import { openLinkInBrowser } from '../../desktop/openExternalLink';
import { useHasInboxDesktopInAppPayments } from '../../desktop/useHasInboxDesktopInAppPayments';
import getOfferRedirectionParams from '../helpers/getOfferRedirectionParams';
import type { Deal, Offer } from '../interface';

const useSelectDeal = (callback?: () => void) => {
    const goToSettingsLink = useSettingsLink();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();

    const handleOnSelectDeal = useCallback(
        (offer: Offer, deal: Deal, currency: Currency) => {
            const urlSearchParams = getOfferRedirectionParams({ offer, deal, currency });
            callback?.();

            const url = `/dashboard?${urlSearchParams.toString()}`;
            if (isElectronApp && !hasInboxDesktopInAppPayments) {
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
