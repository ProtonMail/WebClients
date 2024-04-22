import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useDebouncedValue } from '@proton/pass/hooks/useDebouncedValue';
import type { inviteRecommendationsFailure, inviteRecommendationsSuccess } from '@proton/pass/store/actions';
import { getShareAccessOptionsIntent, inviteRecommendationsIntent } from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';
import type { InviteRecommendationsSuccess } from '@proton/pass/types/data/invites.dto';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

type Options = { shareId: string; pageSize: number };

export const useInviteRecommendations = (autocomplete: string, { shareId, pageSize }: Options) => {
    const dispatch = useDispatch();
    /** Keep a unique requestId per mount to allow multiple components
     * to independently request recommendation data */
    const requestId = useMemo(() => uniqueId(), []);
    const startsWith = useDebouncedValue(autocomplete, 250);
    const emptyBoundary = useRef<MaybeNull<string>>(null);
    const didLoad = useRef(false);

    const [state, setState] = useState<InviteRecommendationsSuccess>({
        emails: [],
        organization: null,
        next: null,
        more: false,
        since: null,
    });

    const { loading, ...recommendations } = useActionRequest<
        typeof inviteRecommendationsIntent,
        typeof inviteRecommendationsSuccess,
        typeof inviteRecommendationsFailure
    >(inviteRecommendationsIntent, {
        onSuccess: ({ data }) => {
            didLoad.current = true;
            const empty = data.emails.length + (data.organization?.emails.length ?? 0) === 0;
            emptyBoundary.current = empty ? startsWith : null;

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
        /** Trigger initial recommendation request when component mounts.
         * Force a revalidation of the share's access options to have fresh
         * member data when reconciliating suggestions against current members */
        dispatch(getShareAccessOptionsIntent(shareId));
        recommendations.dispatch({ pageSize, shareId, since: null, startsWith: '' }, requestId);
    }, []);

    useEffect(() => {
        if (didLoad.current) {
            if (emptyBoundary.current && startsWith.startsWith(emptyBoundary.current)) return;
            recommendations.revalidate({ pageSize, shareId, since: null, startsWith }, requestId);
            setState((prev) => ({ ...prev, since: null }));
        }
    }, [startsWith]);

    return {
        state: { ...state, loading },
        loadMore: () => {
            if (!loading && state.more && state.next) {
                recommendations.revalidate({ pageSize, shareId, since: state.next, startsWith }, requestId);
            }
        },
    };
};
