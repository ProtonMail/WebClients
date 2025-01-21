import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useActionRequest } from '@proton/pass/hooks/useRequest';
import type { AccessKeys } from '@proton/pass/lib/access/types';
import type { inviteRecommendationsFailure, inviteRecommendationsSuccess } from '@proton/pass/store/actions';
import { getShareAccessOptions, inviteRecommendationsIntent } from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';
import type { InviteRecommendationsIntent, InviteRecommendationsSuccess } from '@proton/pass/types/data/invites.dto';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import debounce from '@proton/utils/debounce';

type InviteRecommendationsState = Omit<InviteRecommendationsSuccess, 'startsWith'> & { loading: boolean };

export const useInviteRecommendations = ({ shareId, itemId }: AccessKeys, startsWith: string, pageSize: number) => {
    const dispatch = useDispatch();

    /** Keep a unique requestId per mount to allow multiple components
     * to independently request recommendation data */
    const requestId = useMemo(() => uniqueId(), []);
    const pendingCall = useRef<MaybeNull<boolean>>(null);
    const emptyBoundary = useRef<MaybeNull<string>>(null);

    const [state, setState] = useState<InviteRecommendationsState>({
        emails: [],
        organization: null,
        next: null,
        more: false,
        since: null,
        loading: true,
    });

    const recommendations = useActionRequest<
        typeof inviteRecommendationsIntent,
        typeof inviteRecommendationsSuccess,
        typeof inviteRecommendationsFailure
    >(inviteRecommendationsIntent, {
        onStart: () => setState((prev) => ({ ...prev, since: null })),
        onFailure: () => setState((prev) => ({ ...prev, loading: false })),
        onSuccess: (data) => {
            const { emails, organization } = data;
            const empty = emails.length + (organization?.emails?.length ?? 0) === 0;
            emptyBoundary.current = empty ? data.startsWith : null;

            setState((prev) => ({
                ...data,
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
            }));
        },
    });

    const revalidate = useCallback(
        debounce(
            (dto: InviteRecommendationsIntent, requestId: string) => {
                recommendations.revalidate(dto, requestId);
                pendingCall.current = false;
            },
            250,
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
        if (emptyBoundary.current && startsWith.startsWith(emptyBoundary.current)) return;

        const immediate = pendingCall.current === null;
        pendingCall.current = true;
        setState((prev) => (prev.loading ? prev : { ...prev, loading: true }));
        revalidate({ pageSize, shareId, since: null, startsWith }, requestId);
        if (immediate) revalidate.flush();
    }, [startsWith, shareId, pageSize, requestId]);

    return useMemo(
        () => ({
            state,
            loadMore: () => {
                if (!state.loading && state.more && state.next) {
                    recommendations.revalidate(
                        {
                            pageSize,
                            shareId,
                            since: state.next,
                            startsWith,
                        },
                        requestId
                    );
                }
            },
        }),
        [state]
    );
};
