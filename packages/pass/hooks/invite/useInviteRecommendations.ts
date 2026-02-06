import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import debounce from 'lodash/debounce';

import { useActionRequest } from '@proton/pass/hooks/useRequest';
import type { AccessKeys } from '@proton/pass/lib/access/types';
import { isBusinessPlan } from '@proton/pass/lib/organization/helpers';
import type {
    inviteRecommendationsOrganizationFailure,
    inviteRecommendationsOrganizationSuccess,
    inviteRecommendationsSuggestedFailure,
    inviteRecommendationsSuggestedSuccess,
} from '@proton/pass/store/actions';
import {
    getShareAccessOptions,
    inviteRecommendationsOrganizationIntent,
    inviteRecommendationsSuggestedIntent,
} from '@proton/pass/store/actions';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import type {
    InviteRecommendationsOrganizationIntent,
    InviteRecommendationsOrganizationSuccess,
    InviteRecommendationsSuggestedSuccess,
} from '@proton/pass/types/data/invites.dto';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

type InviteRecommendationsState = {
    suggestions: InviteRecommendationsSuggestedSuccess & { loading: boolean };
    organization: { data: MaybeNull<InviteRecommendationsOrganizationSuccess>; loading: boolean };
};

const setLoading = (state: InviteRecommendationsState, view: 'suggestions' | 'organization', loading: boolean) => {
    return state[view].loading === loading ? state : { ...state, [view]: { ...state[view], loading } };
};

export const useInviteRecommendations = ({ shareId, itemId }: AccessKeys, startsWith: string, pageSize: number) => {
    const dispatch = useDispatch();
    const pendingOrganizationCall = useRef(false);
    const plan = useSelector(selectPassPlan);
    const isB2b = isBusinessPlan(plan);

    const [state, setState] = useState<InviteRecommendationsState>({
        suggestions: { loading: true, startsWith, suggested: [] },
        organization: { loading: true, data: null },
    });

    const suggestions = useActionRequest<
        typeof inviteRecommendationsSuggestedIntent,
        typeof inviteRecommendationsSuggestedSuccess,
        typeof inviteRecommendationsSuggestedFailure
    >(inviteRecommendationsSuggestedIntent, {
        onSuccess: (data) =>
            setState((prev) => ({
                ...prev,
                suggestions: { loading: false, ...data },
            })),
        onFailure: () => setState((prev) => ({ ...prev, suggestions: { ...prev.suggestions, loading: false } })),
    });

    const organization = useActionRequest<
        typeof inviteRecommendationsOrganizationIntent,
        typeof inviteRecommendationsOrganizationSuccess,
        typeof inviteRecommendationsOrganizationFailure
    >(inviteRecommendationsOrganizationIntent, {
        onSuccess: (data) =>
            setState((prev) => ({
                ...prev,
                organization: {
                    /** on success there might still be an incoming request
                     * being debounced - to avoid a flickering glitch, set the
                     * loading state depending on the `pendingCall` value */
                    loading: pendingOrganizationCall.current ?? false,
                    data: {
                        ...data,
                        /** If the response has a `since` property, it is paginated:
                         * Append to the current organization emails list */
                        emails: [...(data.since ? (prev.organization?.data?.emails ?? []) : []), ...data.emails],
                    },
                },
            })),
        onFailure: () => setState((prev) => ({ ...prev, organization: { ...prev.organization, loading: false } })),
    });

    const next = useCallback(
        debounce(
            (dto: InviteRecommendationsOrganizationIntent, requestId: string) => {
                organization.revalidate(dto, requestId);
                pendingOrganizationCall.current = false;
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
        pendingOrganizationCall.current = true;
        next.cancel();

        setState((prev) => {
            let next = { ...prev };
            next = setLoading(next, 'suggestions', true);
            next = setLoading(next, 'organization', isB2b);
            return next;
        });

        suggestions.dispatch({ shareId, startsWith }, uniqueId());
        if (isB2b) next({ pageSize, shareId, since: null, startsWith }, uniqueId());
    }, [startsWith, shareId, pageSize]);

    /** Force initial dispatch on mount */
    useEffect(() => next.flush(), []);

    return useMemo(
        () => ({
            state,
            loadMore: () => {
                if (!state.organization.loading && state.organization.data?.more && state.organization.data?.next) {
                    setState((prev) => setLoading(prev, 'organization', true));
                    organization.revalidate(
                        {
                            pageSize,
                            shareId,
                            since: state.organization.data.next,
                            startsWith: state.organization.data.startsWith,
                        },
                        uniqueId()
                    );
                }
            },
        }),
        [state]
    );
};
