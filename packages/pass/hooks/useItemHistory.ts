import { useEffect, useState } from 'react';

import type { RequestEntryFromAction } from '@proton/pass/hooks/useActionRequest';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import type { itemHistorySuccess } from '@proton/pass/store/actions';
import { itemHistoryIntent } from '@proton/pass/store/actions';
import type { ItemRevisionsIntent, ItemRevisionsSuccess } from '@proton/pass/types';

type Props = Omit<ItemRevisionsIntent, 'since'>;

export const useItemHistory = ({ shareId, itemId, pageSize }: Props) => {
    const [state, setState] = useState<ItemRevisionsSuccess>({
        revisions: [],
        next: null,
        total: 0,
        since: null,
    });

    const { loading, revalidate, dispatch } = useActionRequest({
        action: itemHistoryIntent,
        onSuccess: ({ data }: RequestEntryFromAction<ReturnType<typeof itemHistorySuccess>>) => {
            setState((prev) => ({
                ...data,
                ...(data.since ? { revisions: [...prev.revisions, ...data.revisions] } : { revisions: data.revisions }),
            }));
        },
    });

    useEffect(() => {
        /** Trigger initial request when component mounts */
        dispatch({ shareId, itemId, pageSize, since: null });
    }, []);

    return {
        state: { ...state, loading },
        loadMore: () => {
            if (!loading && state.next) {
                revalidate({ shareId, itemId, pageSize, since: state.next });
            }
        },
    };
};
