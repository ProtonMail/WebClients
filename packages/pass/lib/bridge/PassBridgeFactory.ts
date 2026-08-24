import type { Api } from '@proton/shared/lib/interfaces';

import type { ItemRevision, Api as PassApi, Share, ShareType } from '../../types';
import { first } from '../../utils/array/first';
import { prop } from '../../utils/fp/lens';
import { maxAgeMemoize } from '../../utils/fp/memo';
import { pipe } from '../../utils/fp/pipe';
import { and, truthy } from '../../utils/fp/predicates';
import { sortOn } from '../../utils/fp/sort';
import { waitUntil } from '../../utils/fp/wait-until';
import { obfuscate } from '../../utils/obfuscate/xor';
import { uniqueId } from '../../utils/string/unique-id';
import { UNIX_DAY, UNIX_MINUTE } from '../../utils/time/constants';
import { epochToMs } from '../../utils/time/epoch';
import { getAliasOptions } from '../alias/alias.requests';
import { exposeApi } from '../api/api';
import { exposePassCrypto } from '../crypto';
import { createPassCrypto } from '../crypto/pass-crypto';
import { parseItemRevision } from '../items/item.parser';
import { createAlias, requestAllItemsForShareId } from '../items/item.requests';
import {
    addUrlPauseListEntry,
    deleteUrlPauseListEntry,
    getOrganizationReports,
    getOrganizationSettings,
    getUrlPauseList,
    setOrganizationSettings,
    setPasswordGeneratorPolicySettings,
    updateUrlPauseListEntry,
} from '../organization/organization.requests';
import { parseUnpolledShareResponse } from '../shares/share.parser';
import { requestShares } from '../shares/share.requests';
import { getUserAccess } from '../user/user.requests';
import { isActiveVault, isOwnVault, isWritableVault } from '../vaults/vault.predicates';
import { createVault } from '../vaults/vault.requests';
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
                    getUserAccess: maxAgeMemoize(
                        async () => {
                            const result = await getUserAccess();
                            return result;
                        },
                        { maxAge: epochToMs(UNIX_MINUTE * 5) }
                    ),
                },
                vault: {
                    getDefault: maxAgeMemoize(
                        async () => {
                            const encryptedShares = await requestShares();
                            const shares = await Promise.all(encryptedShares.map(parseUnpolledShareResponse));

                            const candidates = shares
                                .filter(
                                    (share): share is Share<ShareType.Vault> =>
                                        /** FIXME: Add support for predicate type narrowing in `and` combinator */
                                        truthy(share) && and(isActiveVault, isWritableVault, isOwnVault)(share)
                                )
                                .sort(sortOn('createTime', 'ASC'));

                            return first(candidates);
                        },
                        { maxAge: epochToMs(UNIX_DAY * 1) }
                    ),
                    async createDefaultVault() {
                        // In case a default vault has been created in the meantime
                        const defaultVault = await this.getDefault.flush();
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

                        const item = await createAlias({
                            content: {},
                            extraData: { aliasEmail, mailboxes: [mailbox], prefix, signedSuffix },
                            extraFields: [],
                            metadata: { itemUuid, name, note: obfuscate(note ?? '') },
                            optimisticId: itemUuid,
                            shareId,
                            type: 'alias',
                            files: { toAdd: [], toRemove: [] },
                        });

                        return { item: { ...item, aliasEmail } };
                    },
                    getAliasOptions,
                    getAllByShareId: maxAgeMemoize(
                        async (shareId) => {
                            const aliases = (await Promise.all(
                                (await requestAllItemsForShareId({ shareId, OnlyAlias: true }))
                                    .filter(pipe(prop('AliasEmail'), truthy))
                                    .map((item) => parseItemRevision(shareId, item))
                            )) as ItemRevision<'alias'>[];

                            return aliases.map((item): PassBridgeAliasItem => ({ item }));
                        },
                        { maxAge: epochToMs(UNIX_MINUTE * 5) }
                    ),
                },
                organization: {
                    settings: {
                        get: getOrganizationSettings,
                        set: (key, value) => setOrganizationSettings({ [key]: value }),
                        setPasswordGeneratorPolicy: setPasswordGeneratorPolicySettings,
                    },
                    reports: {
                        get: getOrganizationReports,
                    },
                    pauseList: {
                        get: getUrlPauseList,
                        add: addUrlPauseListEntry,
                        update: updateUrlPauseListEntry,
                        delete: deleteUrlPauseListEntry,
                    },
                },
            };

            return passBridgeInstance;
        })()
    );
};
