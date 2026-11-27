import { all, call, put, select } from 'redux-saga/effects';

import { type PatVaultGrant, diffPatGrants } from '../../../lib/access-token/access-token.grants';
import {
    createPersonalAccessToken,
    deletePersonalAccessToken,
    fetchAgentInstructions,
    grantPersonalAccessTokenVaultAccess,
    listPatMonitorRecords,
    listPersonalAccessTokenAccess,
    listPersonalAccessTokens,
    revokePersonalAccessTokenAccess,
} from '../../../lib/access-token/access-token.requests';
import type {
    AccessTokenActionsPage,
    CreateAccessTokenIntent,
    GetAccessTokenActionsIntent,
    PersonalAccessToken,
    PersonalAccessTokenWithKey,
    UpdateAccessTokenAccessIntent,
} from '../../../lib/access-token/access-token.types';
import { buildAccessTokenEnvVar } from '../../../lib/access-token/access-token.utils';
import { PassCrypto } from '../../../lib/crypto';
import type { PersonalAccessTokenShareResponse } from '../../../types/api/pass';
import type { ShareId } from '../../../types/crypto/pass-types';
import type { Maybe } from '../../../types/utils';
import { prop } from '../../../utils/fp/lens';
import { logger } from '../../../utils/logger';
import {
    createAccessToken,
    deleteAccessToken,
    getAccessTokenActions,
    getAccessTokenGrants,
    getAccessTokens,
    getAgentInstructions,
    updateAccessTokenAccess,
} from '../../actions/creators/access-token';
import { createRequestSaga } from '../../request/sagas';
import { selectAccessTokenById, selectAccessTokenGrantsOrEmpty } from '../../selectors/access-token';
import { selectWritableVaults } from '../../selectors/shares';

function* syncAccessTokenGrantsWithBackend(tokenId: string) {
    try {
        const accessGrants: PersonalAccessTokenShareResponse[] = yield call(listPersonalAccessTokenAccess, tokenId);
        yield put(getAccessTokenGrants.success(getAccessTokenGrants.requestID(tokenId), { tokenId, grants: accessGrants }));
    } catch (err) {
        logger.error(`[PAT] Failed to refresh grants after update error`, err);
    }
}

function* grantPatVaultAccess(tokenId: string, grants: PatVaultGrant[], rawPatKey: Uint8Array<ArrayBuffer>) {
    const failedGrantShareIds: ShareId[] = [];

    for (const { shareId, role } of grants) {
        try {
            yield call(grantPersonalAccessTokenVaultAccess, tokenId, shareId, role, rawPatKey);
        } catch (err) {
            failedGrantShareIds.push(shareId);
            logger.error(`[PAT] Granting access to vault ${shareId} failed`, err);
        }
    }

    return failedGrantShareIds;
}

const listSaga = createRequestSaga({
    actions: getAccessTokens,
    call: listPersonalAccessTokens,
});

const createSaga = createRequestSaga({
    actions: createAccessToken,
    call: function* (intent: CreateAccessTokenIntent) {
        const { grants, isAgent } = intent;
        const { data, rawPatKey }: PersonalAccessTokenWithKey = yield call(createPersonalAccessToken, intent);
        const tokenId = data.PersonalAccessTokenID;

        const failedGrantShareIds: ShareId[] = grants.length > 0 ? yield call(grantPatVaultAccess, tokenId, grants, rawPatKey) : [];

        if (grants.length > 0) {
            try {
                const accessGrants: PersonalAccessTokenShareResponse[] = yield call(listPersonalAccessTokenAccess, tokenId);
                yield put(getAccessTokenGrants.success(getAccessTokenGrants.requestID(tokenId), { tokenId, grants: accessGrants }));
            } catch (err) {
                logger.error(`[PAT] Failed to refresh grants after create`, err);
            }
        }

        return {
            pat: data,
            envVar: buildAccessTokenEnvVar(data.Token, rawPatKey),
            isAgent,
            failedGrantShareIds,
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
    call: function* ({ tokenId, grants }: UpdateAccessTokenAccessIntent) {
        const pat: Maybe<PersonalAccessToken> = yield select(selectAccessTokenById(tokenId));
        if (!pat) throw new Error(`Access token ${tokenId} not found in state`);

        const currentGrants: PersonalAccessTokenShareResponse[] = yield select(selectAccessTokenGrantsOrEmpty(tokenId));
        const writableVaults: { shareId: ShareId }[] = yield select(selectWritableVaults);
        const manageableVaultShareIds = new Set<ShareId>(writableVaults.map(prop('shareId')));
        const { toAdd, toRemovePatShareIds, roleUpdates } = diffPatGrants(currentGrants, grants, manageableVaultShareIds);

        const needsGrant = toAdd.length > 0 || roleUpdates.length > 0;

        try {
            if (needsGrant) {
                const rawPatKey: Uint8Array<ArrayBuffer> = yield call(PassCrypto.openAccessTokenKey, pat.PersonalAccessTokenKey);

                if (toAdd.length > 0) {
                    yield all(
                        toAdd.map(({ shareId, role }) => call(grantPersonalAccessTokenVaultAccess, tokenId, shareId, role, rawPatKey))
                    );
                }

                if (toRemovePatShareIds.length > 0) {
                    yield all(toRemovePatShareIds.map((patShareId) => call(revokePersonalAccessTokenAccess, tokenId, patShareId)));
                }

                for (const { revokePatShareId, grant } of roleUpdates) {
                    yield call(revokePersonalAccessTokenAccess, tokenId, revokePatShareId);
                    yield call(grantPersonalAccessTokenVaultAccess, tokenId, grant.shareId, grant.role, rawPatKey);
                }
            } else if (toRemovePatShareIds.length > 0) {
                yield all(toRemovePatShareIds.map((patShareId) => call(revokePersonalAccessTokenAccess, tokenId, patShareId)));
            }

            const updatedGrants: PersonalAccessTokenShareResponse[] = yield call(listPersonalAccessTokenAccess, tokenId);
            return { tokenId, grants: updatedGrants };
        } catch (error) {
            yield call(syncAccessTokenGrantsWithBackend, tokenId);
            throw error;
        }
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
