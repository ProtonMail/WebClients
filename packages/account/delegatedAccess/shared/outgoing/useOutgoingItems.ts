import { useEffect } from 'react';

import noop from '@proton/utils/noop';

import { contactEmailsThunk } from '../../../contactEmails';
import { useDispatch, useSelector } from '../../../store/hooks';
import { listOutgoingDelegatedAccess } from '../../outgoingActions';
import { type EnrichedOutgoingDelegatedAccessReturnValue, selectEnrichedOutgoingDelegatedAccess } from './selector';

export type OutgoingItemsResult = EnrichedOutgoingDelegatedAccessReturnValue;

export const useOutgoingItems = (): OutgoingItemsResult => {
    const dispatch = useDispatch();
    const result = useSelector(selectEnrichedOutgoingDelegatedAccess);

    useEffect(() => {
        Promise.all([dispatch(listOutgoingDelegatedAccess()), dispatch(contactEmailsThunk())]).catch(noop);
    }, []);

    return result;
};
