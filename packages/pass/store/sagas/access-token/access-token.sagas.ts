import { all, call, select } from 'redux-saga/effects';

import {
    createPersonalAccessToken,
    deletePersonalAccessToken,
    grantPersonalAccessTokenAccess,
    listPersonalAccessTokenAccess,
    listPersonalAccessTokens,
    revokePersonalAccessTokenAccess,
} from '@proton/pass/lib/access-token/access-token.requests';
import type {
    PersonalAccessToken,
    PersonalAccessTokenAccessGrant,
    PersonalAccessTokenShareKey,
} from '@proton/pass/lib/access-token/access-token.types';
import { PAT_PRODUCT, buildAccessTokenEnvVar } from '@proton/pass/lib/access-token/access-token.utils';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { createAccessTokenKey } from '@proton/pass/lib/crypto/processes/access-token/create-access-token-key';
import { createAccessTokenShareKeys } from '@proton/pass/lib/crypto/processes/access-token/create-access-token-share-keys';
import { openAccessTokenKey } from '@proton/pass/lib/crypto/processes/access-token/open-access-token-key';
import {
    type AccessTokenAccessGrants,
    type CreateAccessTokenIntent,
    type CreateAccessTokenSuccess,
    type UpdateAccessTokenAccessIntent,
    createAccessToken,
    deleteAccessToken,
    getAccessTokenAccess,
    getAccessTokens,
    updateAccessTokenAccess,
} from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectAccessTokenById, selectAccessTokenGrants } from '@proton/pass/store/selectors/access-token';
import { selectWritableVaults } from '@proton/pass/store/selectors/shares';
import { ShareRole, ShareType } from '@proton/pass/types';

const expirationTimestampFromMinutes = (minutes: number) => Math.floor(Date.now() / 1000) + minutes * 60;

const getPrimaryUserKey = () => {
    const primary = PassCrypto.getContext().primaryUserKey;
    if (!primary?.publicKey || !primary?.privateKey) {
        throw new Error('Primary user key unavailable');
    }
    return primary;
};

const listSaga = createRequestSaga({
    actions: getAccessTokens,
    call: listPersonalAccessTokens,
});

const createSaga = createRequestSaga({
    actions: createAccessToken,
    call: function* ({
        name,
        expirationMinutes,
        isAgent,
        shareIds,
    }: CreateAccessTokenIntent): Generator<any, CreateAccessTokenSuccess, any> {
        const { publicKey, privateKey } = getPrimaryUserKey();
        const { encrypted, raw }: { encrypted: string; raw: Uint8Array<ArrayBuffer> } = yield call(
            createAccessTokenKey,
            publicKey,
            privateKey
        );

        const pat: PersonalAccessToken = yield call(createPersonalAccessToken, {
            Name: name,
            Products: [PAT_PRODUCT],
            PersonalAccessTokenKey: encrypted,
            ExpireTime: expirationTimestampFromMinutes(expirationMinutes),
            Flags: isAgent ? { PassAgent: true } : null,
        });

        if (!pat.Token) throw new Error('Token not returned by server');

        if (shareIds.length > 0) {
            yield all(
                shareIds.map((shareId) =>
                    call(function* () {
                        const Keys: PersonalAccessTokenShareKey[] = yield call(createAccessTokenShareKeys, raw, shareId);
                        yield call(grantPersonalAccessTokenAccess, pat.PersonalAccessTokenID, {
                            ShareID: shareId,
                            TargetType: ShareType.Vault,
                            ShareRoleID: ShareRole.READ,
                            Keys,
                        });
                    })
                )
            );
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
        const writableVaults: ReturnType<typeof selectWritableVaults> = yield select(selectWritableVaults);

        const vaultByVaultId = new Map(writableVaults.map((v) => [v.vaultId, v]));
        const desired = new Set(shareIds);

        const toRevoke: string[] = currentGrants
            .filter((g) => {
                const v = vaultByVaultId.get(g.VaultID);
                return !v || !desired.has(v.shareId);
            })
            .map((g) => g.ShareID);

        const currentlyGranted = new Set(
            currentGrants.map((g) => vaultByVaultId.get(g.VaultID)?.shareId).filter((sid): sid is string => Boolean(sid))
        );
        const toGrant: string[] = shareIds.filter((sid) => !currentlyGranted.has(sid));

        if (toGrant.length > 0) {
            const { publicKey, privateKey } = getPrimaryUserKey();
            const raw: Uint8Array<ArrayBuffer> = yield call(openAccessTokenKey, pat.PersonalAccessTokenKey, privateKey, publicKey);

            yield all(
                toGrant.map((shareId) =>
                    call(function* () {
                        const Keys: PersonalAccessTokenShareKey[] = yield call(createAccessTokenShareKeys, raw, shareId);
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

export default [listSaga, createSaga, deleteSaga, listAccessSaga, updateAccessSaga];
