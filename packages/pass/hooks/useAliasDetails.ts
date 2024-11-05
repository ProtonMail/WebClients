import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { getAliasDetailsIntent } from '@proton/pass/store/actions';
import { aliasDetailsRequest } from '@proton/pass/store/actions/requests';
import { selectAliasMailboxes } from '@proton/pass/store/selectors';
import type { AliasMailbox, Maybe } from '@proton/pass/types';

import { useActionRequest } from './useActionRequest';

type UseAliasDetailsConfig = {
    aliasEmail: string;
    itemId: string;
    shareId: string;
    onAliasMailboxesLoaded?: (mailboxes: Maybe<AliasMailbox[]>) => void;
};

export const useAliasDetails = ({
    aliasEmail,
    itemId,
    shareId,
    onAliasMailboxesLoaded: onAliasDetailsLoaded,
}: UseAliasDetailsConfig) => {
    const { createNotification } = useNotifications();
    const mailboxes = useSelector(selectAliasMailboxes(aliasEmail));

    const getAliasDetails = useActionRequest(getAliasDetailsIntent, {
        requestId: aliasDetailsRequest(aliasEmail),
        onSuccess: () => onAliasDetailsLoaded?.(mailboxes),
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
        () => ({ mailboxes: mailboxes ?? [], loading: getAliasDetails.loading }),
        [mailboxes, getAliasDetails.loading]
    );
};
