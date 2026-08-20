import { useEffect } from 'react';

import { contactEmailsThunk } from '@proton/mail/store/contactEmails';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import noop from '@proton/utils/noop';

import { listIncomingDelegatedAccess } from '../../incomingActions';
import { type EnrichedIncomingDelegatedAccessReturnValue, selectEnrichedIncomingDelegatedAccess } from './selector';

export interface IncomingItemsResult {
    items: EnrichedIncomingDelegatedAccessReturnValue['items'];
    loading: boolean;
}

export const useIncomingItems = (): IncomingItemsResult => {
    const dispatch = useDispatch();
    const { items, loading } = useSelector(selectEnrichedIncomingDelegatedAccess);

    useEffect(() => {
        Promise.all([dispatch(listIncomingDelegatedAccess()), dispatch(contactEmailsThunk())]).catch(noop);
    }, []);

    return { items, loading };
};
