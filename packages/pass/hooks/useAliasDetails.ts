import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';

import type { getAliasDetailsFailure, getAliasDetailsSuccess } from '../store/actions';
import { getAliasDetailsIntent } from '../store/actions';
import { aliasDetailsRequest } from '../store/actions/requests';
import type { AliasMailbox, Maybe, Result } from '../types';
import { useActionRequest } from './useRequest';

type UseAliasDetailsConfig = {
    aliasEmail: string;
    itemId: string;
    shareId: string;
    onAliasMailboxes?: (mailboxes: Result<{ mailboxes: AliasMailbox[] }>) => void;
};

export const useAliasDetails = ({ aliasEmail, itemId, shareId, onAliasMailboxes }: UseAliasDetailsConfig) => {
    const { createNotification } = useNotifications();
    const [mailboxes, setMailboxes] = useState<Maybe<AliasMailbox[]>>();

    const getAliasDetails = useActionRequest<
        typeof getAliasDetailsIntent,
        typeof getAliasDetailsSuccess,
        typeof getAliasDetailsFailure
    >(getAliasDetailsIntent, {
        requestId: aliasDetailsRequest(aliasEmail),
        onSuccess: ({ mailboxes }) => {
            setMailboxes(mailboxes);
            onAliasMailboxes?.({ ok: true, mailboxes });
        },
        onFailure: () => {
            onAliasMailboxes?.({ ok: false });
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
