import { useEffect, useMemo, useState } from 'react';

import type { RequestEntryFromAction } from '@proton/pass/hooks/useActionRequest';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import type { itemHistorySuccess } from '@proton/pass/store/actions';
import { itemHistoryIntent } from '@proton/pass/store/actions';
import type { ItemRevisionsIntent, ItemRevisionsSuccess } from '@proton/pass/types';

type Props = Omit<ItemRevisionsIntent, 'since'>;

export const useItemRevisions = ({ shareId, itemId, pageSize }: Props) => {
    const [state, setState] = useState<ItemRevisionsSuccess>({ next: null, revisions: [], since: null, total: 0 });

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

    return useMemo(
        () => ({
            state: { ...state, loading },
            loadMore: () => !loading && state.next && revalidate({ shareId, itemId, pageSize, since: state.next }),
        }),
        [loading, state, revalidate]
    );
};
