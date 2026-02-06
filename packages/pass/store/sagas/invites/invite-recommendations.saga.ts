import { cancelled, put, takeLatest } from 'redux-saga/effects';

import {
    getInviteRecommendations,
    getInviteRecommendationsOrganization,
    getInviteRecommendationsSuggested,
} from '@proton/pass/lib/invites/invite.requests';
import {
    inviteRecommendationsFailure,
    inviteRecommendationsIntent,
    inviteRecommendationsOrganizationIntent,
    inviteRecommendationsOrganizationSuccess,
    inviteRecommendationsSuccess,
    inviteRecommendationsSuggestedFailure,
    inviteRecommendationsSuggestedIntent,
    inviteRecommendationsSuggestedSuccess,
} from '@proton/pass/store/actions';
import { requestInvalidate } from '@proton/pass/store/request/actions';
import type {
    InviteRecommendationOrgOutput,
    InviteRecommendationSuggestedListOutput,
    InviteRecommendationsResponse,
} from '@proton/pass/types';

function* loadRecommendationsWorker({ payload, meta: { request } }: ReturnType<typeof inviteRecommendationsIntent>): Generator {
    const ctrl = new AbortController();

    try {
        const result = (yield getInviteRecommendations(payload, ctrl.signal)) as InviteRecommendationsResponse;

        const { RecommendedEmails, GroupDisplayName, PlanRecommendedEmails, PlanRecommendedEmailsNextToken } = result;

        yield put(
            inviteRecommendationsSuccess(request.id, {
                startsWith: payload.startsWith,
                emails: RecommendedEmails,
                more: PlanRecommendedEmailsNextToken !== null,
                next: PlanRecommendedEmailsNextToken ?? null,
                organization: GroupDisplayName ? { emails: PlanRecommendedEmails, name: GroupDisplayName } : null,
                since: payload.since,
            })
        );
    } catch (error) {
        yield put(inviteRecommendationsFailure(request.id, error));
    } finally {
        if (yield cancelled()) {
            ctrl.abort();
            yield put(requestInvalidate(request.id));
        }
    }
}

function* loadRecommendationsSuggestedWorker({
    payload,
    meta: { request },
}: ReturnType<typeof inviteRecommendationsSuggestedIntent>): Generator {
    const ctrl = new AbortController();

    try {
        const result = (yield getInviteRecommendationsSuggested(payload, ctrl.signal)) as InviteRecommendationSuggestedListOutput;

        const { Suggested } = result;

        yield put(
            inviteRecommendationsSuggestedSuccess(request.id, {
                startsWith: payload.startsWith,
                suggested: Suggested.map((s) => ({
                    email: s.Email,
                    addressId: s.AddressID,
                    isGroup: s.IsGroup,
                })),
            })
        );
    } catch (error) {
        yield put(inviteRecommendationsSuggestedFailure(request.id, error));
    } finally {
        if (yield cancelled()) {
            ctrl.abort();
            yield put(requestInvalidate(request.id));
        }
    }
}

function* loadRecommendationsOrganizationWorker({
    payload,
    meta: { request },
}: ReturnType<typeof inviteRecommendationsOrganizationIntent>): Generator {
    const ctrl = new AbortController();

    try {
        const result = (yield getInviteRecommendationsOrganization(payload, ctrl.signal)) as InviteRecommendationOrgOutput;

        const { GroupDisplayName, NextToken, Entries } = result;

        yield put(
            inviteRecommendationsOrganizationSuccess(request.id, {
                startsWith: payload.startsWith,
                name: GroupDisplayName,
                emails: Entries.map(({ Email }) => Email),
                more: !!NextToken,
                next: NextToken ?? null,
                since: payload.since,
            })
        );
    } catch (error) {
        yield put(inviteRecommendationsFailure(request.id, error));
    } finally {
        if (yield cancelled()) {
            ctrl.abort();
            yield put(requestInvalidate(request.id));
        }
    }
}

export default function* watcher() {
    yield takeLatest(inviteRecommendationsIntent.match, loadRecommendationsWorker);
    yield takeLatest(inviteRecommendationsSuggestedIntent.match, loadRecommendationsSuggestedWorker);
    yield takeLatest(inviteRecommendationsOrganizationIntent.match, loadRecommendationsOrganizationWorker);
}
