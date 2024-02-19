import { getAliasDetails, getAliasOptions } from '@proton/pass/lib/alias/alias.requests';
import { exposeApi } from '@proton/pass/lib/api/api';
import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { createPassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { createAlias, requestAllItemsForShareId } from '@proton/pass/lib/items/item.requests';
import { parseShareResponse } from '@proton/pass/lib/shares/share.parser';
import { requestShares } from '@proton/pass/lib/shares/share.requests';
import { getUserAccess } from '@proton/pass/lib/user/user.requests';
import { isActiveVault, isOwnVault, isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { createVault } from '@proton/pass/lib/vaults/vault.requests';
import type { ItemRevision, Api as PassApi } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { and, truthy } from '@proton/pass/utils/fp/predicates';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import type { Api } from '@proton/shared/lib/interfaces';
import unary from '@proton/utils/unary';

import type { PassBridge, PassBridgeAliasItem, PassBridgeInitOptions } from './types';

export const createPassBridge = (api: Api): PassBridge => {
    exposeApi(api as PassApi);

    const PassCrypto = exposePassCrypto(createPassCrypto());

    return {
        ready: () => waitUntil(() => PassCrypto.ready, 250).then(() => true),
        hydrate: async ({ user, addresses, authStore }: PassBridgeInitOptions) => {
            await PassCrypto.hydrate({ user, addresses, keyPassword: authStore.getPassword() });
        },
        user: {
            getUserAccess,
        },
        vault: {
            getDefault: async (hadVaultCallback) => {
                const encryptedShares = await requestShares();
                const shares = (await Promise.all(encryptedShares.map(unary(parseShareResponse)))).filter(truthy);
                const candidates = shares
                    .filter(and(isActiveVault, isWritableVault, isOwnVault))
                    .sort(sortOn('createTime', 'ASC'));

                const defaultVault = first(candidates);
                if (defaultVault) {
                    hadVaultCallback?.(true);
                    return defaultVault;
                } else {
                    hadVaultCallback?.(false);
                    const newVault = await createVault({
                        content: {
                            name: 'Personal',
                            description: 'Personal vault (created from Mail)',
                            display: {},
                        },
                    });
                    return newVault;
                }
            },
        },
        alias: {
            create: async ({ shareId, name, note, alias: { aliasEmail, mailbox, prefix, signedSuffix } }) => {
                const itemUuid = uniqueId();

                const encryptedItem = await createAlias({
                    content: {},
                    createTime: getEpoch(),
                    extraData: { aliasEmail, mailboxes: [mailbox], prefix, signedSuffix },
                    extraFields: [],
                    metadata: { itemUuid, name, note: obfuscate(note ?? '') },
                    optimisticId: itemUuid,
                    shareId,
                    type: 'alias',
                });

                const item = (await parseItemRevision(shareId, encryptedItem)) as ItemRevision<'alias'>;

                return {
                    item: { ...item, aliasEmail },
                    aliasDetails: { aliasEmail, mailboxes: [mailbox] },
                };
            },
            getAliasOptions,
            getAllByShareId: async (shareId) => {
                const aliases = (await Promise.all(
                    (await requestAllItemsForShareId({ shareId, OnlyAlias: true }))
                        .filter(pipe(prop('AliasEmail'), truthy))
                        .map((item) => parseItemRevision(shareId, item))
                )) as ItemRevision<'alias'>[];

                return Promise.all(
                    aliases.map(
                        async (item): Promise<PassBridgeAliasItem> => ({
                            item,
                            aliasDetails: await getAliasDetails(shareId, item.itemId),
                        })
                    )
                );
            },
        },
    };
};
