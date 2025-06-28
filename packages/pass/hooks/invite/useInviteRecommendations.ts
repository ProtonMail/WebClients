import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useActionRequest } from '@proton/pass/hooks/useRequest';
import type { AccessKeys } from '@proton/pass/lib/access/types';
import type { inviteRecommendationsFailure, inviteRecommendationsSuccess } from '@proton/pass/store/actions';
import { getShareAccessOptions, inviteRecommendationsIntent } from '@proton/pass/store/actions';
import type { InviteRecommendationsIntent, InviteRecommendationsSuccess } from '@proton/pass/types/data/invites.dto';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import debounce from '@proton/utils/debounce';

type InviteRecommendationsState = InviteRecommendationsSuccess & { loading: boolean };

export const useInviteRecommendations = ({ shareId, itemId }: AccessKeys, startsWith: string, pageSize: number) => {
    const dispatch = useDispatch();
    const pendingCall = useRef(false);

    const [state, setState] = useState<InviteRecommendationsState>({
        emails: [],
        loading: true,
        more: false,
        next: null,
        organization: null,
        since: null,
        startsWith,
    });

    const recommendations = useActionRequest<
        typeof inviteRecommendationsIntent,
        typeof inviteRecommendationsSuccess,
        typeof inviteRecommendationsFailure
    >(inviteRecommendationsIntent, {
        onSuccess: (data) =>
            setState((prev) => ({
                ...data,
                startsWith: data.startsWith,
                /** on success there might still be an incoming request
                 * being debounced - to avoid a flickering glitch, set the
                 * loading state depending on the `pendingCall` value */
                loading: pendingCall.current ?? false,
                organization: data.organization
                    ? {
                          ...data.organization,
                          /** If the response has a `since` property, it is paginated:
                           * Append to the current organization emails list */
                          emails: [
                              ...(data.since ? (prev.organization?.emails ?? []) : []),
                              ...data.organization.emails,
                          ],
                      }
                    : null,
            })),
        onFailure: () => setState((prev) => ({ ...prev, loading: false })),
    });

    const next = useCallback(
        debounce(
            (dto: InviteRecommendationsIntent, requestId: string) => {
                recommendations.revalidate(dto, requestId);
                pendingCall.current = false;
            },
            500,
            { trailing: true, leading: false }
        ),
        []
    );

    useEffect(() => {
        /** Trigger initial recommendation request when component mounts.
         * Force a revalidation of the share's access options to have fresh
         * member data when reconciliating suggestions against current members */
        dispatch(getShareAccessOptions.intent({ shareId, itemId }));
    }, [shareId, itemId]);

    useEffect(() => {
        pendingCall.current = true;
        next.cancel();

        setState((prev) => (prev.loading ? prev : { ...prev, loading: true }));
        next({ pageSize, shareId, since: null, startsWith }, uniqueId());
    }, [startsWith, shareId, pageSize]);

    /** Force initial dispatch on mount */
    useEffect(() => next.flush(), []);

    return useMemo(
        () => ({
            state,
            loadMore: () => {
                if (!state.loading && state.more && state.next) {
                    setState((prev) => ({ ...prev, loading: true }));
                    recommendations.revalidate(
                        {
                            pageSize,
                            shareId,
                            since: state.next,
                            startsWith: state.startsWith,
                        },
                        uniqueId()
                    );
                }
            },
        }),
        [state]
    );
};
