import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { getAliasDetailsIntent } from '@proton/pass/store/actions';
import { aliasDetailsRequest } from '@proton/pass/store/actions/requests';
import { selectAliasDetails } from '@proton/pass/store/selectors';
import type { AliasMailbox, Maybe } from '@proton/pass/types';

import { useActionRequest } from './useActionRequest';

type UseAliasDetailsConfig = {
    aliasEmail: string;
    itemId: string;
    shareId: string;
    onAliasDetailsLoaded?: (mailboxes: Maybe<AliasMailbox[]>) => void;
};

export const useAliasDetails = ({ aliasEmail, itemId, shareId, onAliasDetailsLoaded }: UseAliasDetailsConfig) => {
    const { createNotification } = useNotifications();
    const aliasDetails = useSelector(selectAliasDetails(aliasEmail));

    const getAliasDetails = useActionRequest(getAliasDetailsIntent, {
        initialRequestId: aliasDetailsRequest(aliasEmail),
        onSuccess: () => onAliasDetailsLoaded?.(aliasDetails),
        onFailure: () => {
            createNotification({
                type: 'warning',
                text: c('Warning').t`Cannot retrieve mailboxes for this alias right now`,
            });
        },
    });

    useEffect(() => {
        getAliasDetails.dispatch({ shareId, itemId, aliasEmail });
    }, [shareId, itemId, aliasEmail]);

    return useMemo(
        () => ({ value: aliasDetails ?? [], loading: getAliasDetails.loading }),
        [aliasDetails, getAliasDetails.loading]
    );
};
