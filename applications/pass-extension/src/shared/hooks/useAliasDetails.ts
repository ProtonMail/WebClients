import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { getAliasDetailsIntent, selectAliasDetails } from '@proton/pass/store';
import { aliasDetailsRequest } from '@proton/pass/store/actions/requests';
import type { AliasMailbox, Maybe } from '@proton/pass/types';

import { useActionWithRequest } from './useActionWithRequest';

type UseAliasDetailsConfig = {
    aliasEmail: string;
    itemId: string;
    shareId: string;
    onAliasDetailsLoaded?: (mailboxes: Maybe<AliasMailbox[]>) => void;
};

export const useAliasDetails = ({ aliasEmail, itemId, shareId, onAliasDetailsLoaded }: UseAliasDetailsConfig) => {
    const { createNotification } = useNotifications();
    const aliasDetails = useSelector(selectAliasDetails(aliasEmail));

    const getAliasDetails = useActionWithRequest({
        action: getAliasDetailsIntent,
        requestId: aliasDetailsRequest(aliasEmail),
        onSuccess: () => onAliasDetailsLoaded?.(aliasDetails),
        onFailure: () =>
            createNotification({
                type: 'warning',
                text: c('Warning').t`Cannot retrieve mailboxes for this alias right now`,
            }),
    });

    useEffect(() => {
        if (aliasDetails === undefined) getAliasDetails.dispatch({ shareId, itemId, aliasEmail });
        else onAliasDetailsLoaded?.(aliasDetails);
    }, [shareId, itemId, aliasEmail]);

    return useMemo(
        () => ({ value: aliasDetails ?? [], loading: getAliasDetails.loading }),
        [aliasDetails, getAliasDetails.loading]
    );
};
