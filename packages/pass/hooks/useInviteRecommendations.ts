import { useEffect, useMemo, useRef, useState } from 'react';

import type { RequestEntryFromAction } from '@proton/pass/hooks/useActionRequest';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useDebouncedValue } from '@proton/pass/hooks/useDebouncedValue';
import type { inviteRecommendationsSuccess } from '@proton/pass/store/actions';
import { inviteRecommendationsIntent } from '@proton/pass/store/actions';
import type { InviteRecommendationsSuccess } from '@proton/pass/types/data/invites.dto';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

type Options = { shareId: string; pageSize: number };

export const useInviteRecommendations = (autocomplete: string, { shareId, pageSize }: Options) => {
    /** Keep a unique requestId per mount to allow multiple components
     * to independently request recommendation data */
    const requestId = useMemo(() => uniqueId(), []);
    const startsWith = useDebouncedValue(autocomplete, 250);
    const didLoad = useRef(false);

    const [state, setState] = useState<InviteRecommendationsSuccess>({
        emails: [],
        organization: null,
        next: null,
        more: false,
        since: null,
    });

    const { loading, revalidate, dispatch } = useActionRequest({
        action: inviteRecommendationsIntent,
        onSuccess: ({ data }: RequestEntryFromAction<ReturnType<typeof inviteRecommendationsSuccess>>) => {
            didLoad.current = true;
            setState((prev) => ({
                ...data,
                organization: data.organization
                    ? {
                          ...data.organization,
                          /** If the response has a `since` property, it is paginated:
                           * Append to the current organization emails list */
                          emails: [...(data.since ? prev.organization?.emails ?? [] : []), ...data.organization.emails],
                      }
                    : null,
            }));
        },
    });

    useEffect(() => {
        /** Trigger initial request when component mounts */
        dispatch({ pageSize, shareId, since: null, startsWith: '' }, requestId);
    }, []);

    useEffect(() => {
        if (didLoad) {
            setState((prev) => ({ ...prev, since: null }));
            revalidate({ pageSize, shareId, since: null, startsWith }, requestId);
        }
    }, [startsWith]);

    return {
        state: { ...state, loading },
        loadMore: () => {
            if (!loading && state.more && state.next) {
                revalidate({ pageSize, shareId, since: state.next, startsWith }, requestId);
            }
        },
    };
};
