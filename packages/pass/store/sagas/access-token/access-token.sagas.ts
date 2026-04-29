import { all, call, select } from 'redux-saga/effects';

import {
    createPersonalAccessToken,
    deletePersonalAccessToken,
    fetchAgentInstructions,
    grantPersonalAccessTokenAccess,
    listPatMonitorRecords,
    listPersonalAccessTokenAccess,
    listPersonalAccessTokens,
    revokePersonalAccessTokenAccess,
} from '@proton/pass/lib/access-token/access-token.requests';
import type {
    DecodedPatMonitorPayload,
    DecodedPatMonitorRecord,
    PatMonitorRecord,
    PersonalAccessToken,
    PersonalAccessTokenAccessGrant,
    PersonalAccessTokenShareKey,
} from '@proton/pass/lib/access-token/access-token.types';
import { PAT_PRODUCT, buildAccessTokenEnvVar } from '@proton/pass/lib/access-token/access-token.utils';
import { PassCrypto } from '@proton/pass/lib/crypto';
import type { DecryptedActionPayload } from '@proton/pass/lib/crypto/processes/access-token/open-action-payload';
import {
    type AccessTokenAccessGrants,
    type AccessTokenActionsPage,
    type CreateAccessTokenIntent,
    type GetAccessTokenActionsIntent,
    type UpdateAccessTokenAccessIntent,
    createAccessToken,
    deleteAccessToken,
    getAccessTokenAccess,
    getAccessTokenActions,
    getAccessTokens,
    getAgentInstructions,
    updateAccessTokenAccess,
} from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectAccessTokenById, selectAccessTokenGrants } from '@proton/pass/store/selectors/access-token';
import { selectShareState } from '@proton/pass/store/selectors/shares';
import { ShareRole, ShareType } from '@proton/pass/types';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { prop } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';

const expirationTimestampFromMinutes = (minutes: number) => Math.floor(Date.now() / 1000) + minutes * 60;

const listSaga = createRequestSaga({
    actions: getAccessTokens,
    call: listPersonalAccessTokens,
});

const createSaga = createRequestSaga({
    actions: createAccessToken,
    call: function* ({ name, expirationMinutes, isAgent, shareIds }: CreateAccessTokenIntent) {
        const { encrypted, raw }: { encrypted: string; raw: Uint8Array<ArrayBuffer> } = yield call(PassCrypto.createAccessTokenKey);

        const pat: PersonalAccessToken = yield call(createPersonalAccessToken, {
            Name: name,
            Products: [PAT_PRODUCT],
            PersonalAccessTokenKey: encrypted,
            ExpireTime: expirationTimestampFromMinutes(expirationMinutes),
            Flags: isAgent ? { PassAgent: true } : null,
        });

        if (!pat.Token) throw new Error('Token not returned by server');

        if (shareIds.length > 0) {
            try {
                yield all(
                    shareIds.map((shareId) =>
                        call(function* () {
                            const Keys: PersonalAccessTokenShareKey[] = yield call([PassCrypto, 'createAccessTokenShareKeys'], {
                                rawPatKey: raw,
                                shareId,
                            });
                            yield call(grantPersonalAccessTokenAccess, pat.PersonalAccessTokenID, {
                                ShareID: shareId,
                                TargetType: ShareType.Vault,
                                ShareRoleID: ShareRole.READ,
                                Keys,
                            });
                        })
                    )
                );
            } catch (err) {
                /* The token exists server-side but at least one request failed,
                 * leaving the token without all the access the user requested.
                 * Delete the token to avoid a half-configured PAT. */
                logger.error(`[Saga::AccessToken] grant failed, cancelling token`, getErrorMessage(err));
                yield call(deletePersonalAccessToken, pat.PersonalAccessTokenID);
                throw err;
            }
        }

        return { pat, envVar: buildAccessTokenEnvVar(pat.Token, raw), isAgent };
    },
});

const deleteSaga = createRequestSaga({
    actions: deleteAccessToken,
    call: function* (id: string): Generator<any, string, any> {
        yield call(deletePersonalAccessToken, id);
        return id;
    },
});

const listAccessSaga = createRequestSaga({
    actions: getAccessTokenAccess,
    call: function* (tokenId: string): Generator<any, AccessTokenAccessGrants, any> {
        const grants: PersonalAccessTokenAccessGrant[] = yield call(listPersonalAccessTokenAccess, tokenId);
        return { tokenId, grants };
    },
});

const updateAccessSaga = createRequestSaga({
    actions: updateAccessTokenAccess,
    call: function* ({ tokenId, shareIds }: UpdateAccessTokenAccessIntent): Generator<any, AccessTokenAccessGrants, any> {
        const pat: PersonalAccessToken | undefined = yield select(selectAccessTokenById(tokenId));
        if (!pat) throw new Error(`Access token ${tokenId} not found in state`);

        const currentGrants: PersonalAccessTokenAccessGrant[] = yield select(selectAccessTokenGrants(tokenId));
        const shares: ReturnType<typeof selectShareState> = yield select(selectShareState);
        const grantUserShareId = (grant: PersonalAccessTokenAccessGrant) => shares[grant.ParentShareID]?.shareId;

        const desired = new Set(shareIds);
        const currentlyGranted = new Set(currentGrants.map(grantUserShareId));
        const toRevoke = currentGrants.filter((grant) => !desired.has(grantUserShareId(grant))).map(prop('ShareID'));
        const toGrant = shareIds.filter((sid) => !currentlyGranted.has(sid));

        if (toGrant.length > 0) {
            const raw: Uint8Array<ArrayBuffer> = yield call([PassCrypto, 'openAccessTokenKey'], pat.PersonalAccessTokenKey);

            yield all(
                toGrant.map((shareId) =>
                    call(function* () {
                        const Keys: PersonalAccessTokenShareKey[] = yield call([PassCrypto, 'createAccessTokenShareKeys'], {
                            rawPatKey: raw,
                            shareId,
                        });
                        yield call(grantPersonalAccessTokenAccess, tokenId, {
                            ShareID: shareId,
                            TargetType: ShareType.Vault,
                            ShareRoleID: ShareRole.READ,
                            Keys,
                        });
                    })
                )
            );
        }

        if (toRevoke.length > 0) {
            yield all(toRevoke.map((grantShareId) => call(revokePersonalAccessTokenAccess, tokenId, grantShareId)));
        }

        const grants: PersonalAccessTokenAccessGrant[] = yield call(listPersonalAccessTokenAccess, tokenId);
        return { tokenId, grants };
    },
});

const decodeRecord = function* (
    record: PatMonitorRecord,
    rawPatKey: Uint8Array<ArrayBuffer>
): Generator<any, DecodedPatMonitorRecord, any> {
    if (!record.Payload) return { ...record, decodedPayload: null };

    try {
        const decoded: DecryptedActionPayload | null = yield call([PassCrypto, 'openActionPayload'], {
            encodedPayload: record.Payload,
            rawPatKey,
        });
        if (!decoded) return { ...record, decodedPayload: null };

        const decodedPayload: DecodedPatMonitorPayload =
            decoded.kind === 'agent-action'
                ? {
                      kind: 'agent-action',
                      reason: decoded.agentAction.reason,
                      vaultName: decoded.agentAction.vaultName,
                      itemName: decoded.agentAction.itemName,
                      folderName: decoded.agentAction.folderName,
                  }
                : { kind: 'unknown' };
        return { ...record, decodedPayload };
    } catch (e) {
        /* Decryption / proto-decode failure for a single record shouldn't
         * abort the whole page — surface it as a `decode-error` so the UI
         * can flag the row and the dev tools log shows the cause. */
        const error = getErrorMessage(e);
        logger.error(`[Saga::AccessToken] decode failed`, error);
        return { ...record, decodedPayload: { kind: 'decode-error', error } };
    }
};

const listActionsSaga = createRequestSaga({
    actions: getAccessTokenActions,
    call: function* ({ tokenId, since }: GetAccessTokenActionsIntent): Generator<any, AccessTokenActionsPage, any> {
        const pat: PersonalAccessToken | undefined = yield select(selectAccessTokenById(tokenId));
        if (!pat) throw new Error(`Access token ${tokenId} not found in state`);

        const { records, nextSince }: { records: PatMonitorRecord[]; nextSince: string | null } = yield call(
            listPatMonitorRecords,
            tokenId,
            since
        );

        let decoded: DecodedPatMonitorRecord[];
        if (records.some((r) => r.Payload)) {
            const rawPatKey: Uint8Array<ArrayBuffer> = yield call([PassCrypto, 'openAccessTokenKey'], pat.PersonalAccessTokenKey);
            decoded = yield all(records.map((record) => call(decodeRecord, record, rawPatKey)));
        } else {
            decoded = records.map((record) => ({ ...record, decodedPayload: null }));
        }

        return { tokenId, records: decoded, nextSince, append: Boolean(since) };
    },
});

const agentInstructionsSaga = createRequestSaga({
    actions: getAgentInstructions,
    call: fetchAgentInstructions,
});

export default [listSaga, createSaga, deleteSaga, listAccessSaga, updateAccessSaga, listActionsSaga, agentInstructionsSaga];
