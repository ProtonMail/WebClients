import { cancelled, put, takeLatest } from 'redux-saga/effects';

import { getInviteRecommendations } from '@proton/pass/lib/invites/invite.requests';
import {
    inviteRecommendationsFailure,
    inviteRecommendationsIntent,
    inviteRecommendationsSuccess,
} from '@proton/pass/store/actions';
import type { InviteRecommendationsResponse } from '@proton/pass/types';
import { wait } from '@proton/shared/lib/helpers/promise';

function* loadRecommendationsWorker({
    payload,
    meta: { request },
}: ReturnType<typeof inviteRecommendationsIntent>): Generator {
    const ctrl = new AbortController();

    try {
        yield wait(100);

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
        if (yield cancelled()) ctrl.abort();
    }
}

export default function* watcher() {
    yield takeLatest(inviteRecommendationsIntent.match, loadRecommendationsWorker);
}
