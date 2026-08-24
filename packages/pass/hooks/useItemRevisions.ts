import { useEffect, useMemo, useState } from 'react';

import type { itemHistoryFailure, itemHistorySuccess } from '../store/actions';
import { itemHistoryIntent } from '../store/actions';
import type { ItemRevisionsIntent, ItemRevisionsSuccess } from '../types';
import { useActionRequest } from './useRequest';

const initialState = { next: null, revisions: [], since: null, total: 0 };

type Props = Omit<ItemRevisionsIntent, 'since'>;

export const useItemRevisions = ({ shareId, itemId, pageSize }: Props) => {
    const [state, setState] = useState<ItemRevisionsSuccess>(initialState);

    const { loading, revalidate, dispatch } = useActionRequest<
        typeof itemHistoryIntent,
        typeof itemHistorySuccess,
        typeof itemHistoryFailure
    >(itemHistoryIntent, {
        onSuccess: (data) => {
            setState((prev) => ({
                ...data,
                ...(data.since ? { revisions: [...prev.revisions, ...data.revisions] } : { revisions: data.revisions }),
            }));
        },
    });

    useEffect(() => {
        setState(initialState);
        /** Trigger initial request when component mounts */
        dispatch({ shareId, itemId, pageSize, since: null });
    }, [shareId, itemId]);

    return useMemo(
        () => ({
            state: { ...state, loading },
            loadMore: () => !loading && state.next && revalidate({ shareId, itemId, pageSize, since: state.next }),
        }),
        [loading, state, revalidate]
    );
};
