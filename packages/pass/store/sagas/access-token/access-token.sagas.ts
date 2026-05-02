import { all, call, select } from 'redux-saga/effects';

import {
    createPersonalAccessToken,
    deletePersonalAccessToken,
    fetchAgentInstructions,
    grantPersonalAccessTokenVaultAccess,
    listPatMonitorRecords,
    listPersonalAccessTokenAccess,
    listPersonalAccessTokens,
    revokePersonalAccessTokenAccess,
} from '@proton/pass/lib/access-token/access-token.requests';
import type {
    AccessTokenActionsPage,
    CreateAccessTokenIntent,
    GetAccessTokenActionsIntent,
    PersonalAccessToken,
    PersonalAccessTokenWithKey,
    UpdateAccessTokenAccessIntent,
} from '@proton/pass/lib/access-token/access-token.types';
import { buildAccessTokenEnvVar } from '@proton/pass/lib/access-token/access-token.utils';
import { PassCrypto } from '@proton/pass/lib/crypto';
import {
    createAccessToken,
    deleteAccessToken,
    getAccessTokenActions,
    getAccessTokenGrants,
    getAccessTokens,
    getAgentInstructions,
    updateAccessTokenAccess,
} from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectAccessTokenById, selectAccessTokenGrants } from '@proton/pass/store/selectors/access-token';
import { selectShareState } from '@proton/pass/store/selectors/shares';
import type { Maybe, PersonalAccessTokenShareResponse } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';

const listSaga = createRequestSaga({
    actions: getAccessTokens,
    call: listPersonalAccessTokens,
});

const createSaga = createRequestSaga({
    actions: createAccessToken,
    call: function* (intent: CreateAccessTokenIntent) {
        const { shareIds, isAgent } = intent;
        const { data, rawPatKey }: PersonalAccessTokenWithKey = yield call(createPersonalAccessToken, intent);
        const tokenId = data.PersonalAccessTokenID;

        if (shareIds.length > 0) {
            try {
                const grantRequests = shareIds.map((shareId) => call(grantPersonalAccessTokenVaultAccess, tokenId, shareId, rawPatKey));
                yield all(grantRequests);
            } catch (err) {
                logger.error(`[PAT] Granting access to PAT failed`, err);
            }
        }

        return {
            pat: data,
            envVar: buildAccessTokenEnvVar(data.Token, rawPatKey),
            isAgent,
        };
    },
});

const deleteSaga = createRequestSaga({
    actions: deleteAccessToken,
    call: function* (id: string) {
        yield call(deletePersonalAccessToken, id);
        return id;
    },
});

const listAccessSaga = createRequestSaga({
    actions: getAccessTokenGrants,
    call: function* (tokenId: string) {
        const grants: PersonalAccessTokenShareResponse[] = yield call(listPersonalAccessTokenAccess, tokenId);
        return { tokenId, grants };
    },
});

const updateAccessSaga = createRequestSaga({
    actions: updateAccessTokenAccess,
    call: function* ({ tokenId, shareIds }: UpdateAccessTokenAccessIntent) {
        const pat: Maybe<PersonalAccessToken> = yield select(selectAccessTokenById(tokenId));
        if (!pat) throw new Error(`Access token ${tokenId} not found in state`);

        const currentGrants: PersonalAccessTokenShareResponse[] = yield select(selectAccessTokenGrants(tokenId));
        const shares: ReturnType<typeof selectShareState> = yield select(selectShareState);
        const grantUserShareId = (grant: PersonalAccessTokenShareResponse) => shares[grant.ParentShareID]?.shareId;

        const desired = new Set(shareIds);
        const currentlyGranted = new Set(currentGrants.map(grantUserShareId));
        const toRevoke = currentGrants.filter((grant) => !desired.has(grantUserShareId(grant))).map(prop('ShareID'));
        const toGrant = shareIds.filter((sid) => !currentlyGranted.has(sid));

        if (toGrant.length > 0) {
            const rawPatKey: Uint8Array<ArrayBuffer> = yield call(PassCrypto.openAccessTokenKey, pat.PersonalAccessTokenKey);
            const grantRequests = toGrant.map((shareId) => call(grantPersonalAccessTokenVaultAccess, tokenId, shareId, rawPatKey));
            yield all(grantRequests);
        }

        if (toRevoke.length > 0) {
            const revokeRequests = toRevoke.map((shareId) => call(revokePersonalAccessTokenAccess, tokenId, shareId));
            yield all(revokeRequests);
        }

        const grants: PersonalAccessTokenShareResponse[] = yield call(listPersonalAccessTokenAccess, tokenId);
        return { tokenId, grants };
    },
});

const listActionsSaga = createRequestSaga({
    actions: getAccessTokenActions,
    call: function* ({ tokenId, since }: GetAccessTokenActionsIntent) {
        const pat: Maybe<PersonalAccessToken> = yield select(selectAccessTokenById(tokenId));
        if (!pat) throw new Error(`Access token ${tokenId} not found in state`);

        const page: AccessTokenActionsPage = yield call(listPatMonitorRecords, pat, since);
        return page;
    },
});

const agentInstructionsSaga = createRequestSaga({
    actions: getAgentInstructions,
    call: fetchAgentInstructions,
});

export default [listSaga, createSaga, deleteSaga, listAccessSaga, updateAccessSaga, listActionsSaga, agentInstructionsSaga];
