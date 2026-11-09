import type { ReactNode } from 'react';

import {
    type GetOfferRenewNotice,
    OfferRenewNoticeContext,
} from '@proton/components/containers/offers/offerRenewNoticeContext';

import { getCheckoutRenewNoticeTextFromCheckResult } from './RenewalNotice';

const getOfferRenewNotice: GetOfferRenewNotice = (props) => getCheckoutRenewNoticeTextFromCheckResult(props) as string;

export const OfferRenewNoticeProvider = ({ children }: { children: ReactNode }) => {
    return <OfferRenewNoticeContext.Provider value={getOfferRenewNotice}>{children}</OfferRenewNoticeContext.Provider>;
};
