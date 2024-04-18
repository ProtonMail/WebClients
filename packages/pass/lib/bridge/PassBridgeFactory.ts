import { getAliasOptions } from '@proton/pass/lib/alias/alias.requests';
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
import { maxAgeMemoize } from '@proton/pass/utils/fp/memo';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { and, truthy } from '@proton/pass/utils/fp/predicates';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import type { Api } from '@proton/shared/lib/interfaces';
import unary from '@proton/utils/unary';

import type { PassBridge, PassBridgeAliasItem } from './types';

let passBridgeInstance: PassBridge | undefined;

export const createPassBridge = (api: Api): PassBridge => {
    return (
        passBridgeInstance ||
        (() => {
            exposeApi(api as PassApi);
            const PassCrypto = exposePassCrypto(createPassCrypto());

            passBridgeInstance = {
                async init({ user, addresses, authStore }) {
                    await PassCrypto.hydrate({ user, addresses, keyPassword: authStore.getPassword(), clear: false });
                    const isReady = await waitUntil(() => PassCrypto.ready, 250).then(() => true);

                    return isReady;
                },
                user: {
                    getUserAccess: maxAgeMemoize(async () => {
                        const result = await getUserAccess();
                        return result;
                    }),
                },
                vault: {
                    getDefault: maxAgeMemoize(async () => {
                        const encryptedShares = await requestShares();
                        const shares = (await Promise.all(encryptedShares.map(unary(parseShareResponse)))).filter(
                            truthy
                        );
                        const candidates = shares
                            .filter(and(isActiveVault, isWritableVault, isOwnVault))
                            .sort(sortOn('createTime', 'ASC'));

                        const defaultVault = first(candidates);

                        return defaultVault;
                    }),
                    async createDefaultVault() {
                        // In case a default vault has been created in the meantime
                        const defaultVault = await this.getDefault({ maxAge: 0 });
                        if (defaultVault) {
                            return defaultVault;
                        }

                        const newVault = await createVault({
                            content: {
                                name: 'Personal',
                                description: 'Personal vault (created from Mail)',
                                display: {},
                            },
                        });
                        return newVault;
                    },
                },
                alias: {
                    async create({ shareId, name, note, alias: { aliasEmail, mailbox, prefix, signedSuffix } }) {
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
                        };
                    },
                    getAliasOptions,
                    getAllByShareId: maxAgeMemoize(async (shareId) => {
                        const aliases = (await Promise.all(
                            (await requestAllItemsForShareId({ shareId, OnlyAlias: true }))
                                .filter(pipe(prop('AliasEmail'), truthy))
                                .map((item) => parseItemRevision(shareId, item))
                        )) as ItemRevision<'alias'>[];

                        return aliases.map((item): PassBridgeAliasItem => ({ item }));
                    }),
                },
            };

            return passBridgeInstance;
        })()
    );
};
