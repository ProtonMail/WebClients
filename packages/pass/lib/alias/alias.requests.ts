import { c } from 'ttag';

import { MAX_BATCH_PER_REQUEST } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import { createPageIterator } from '@proton/pass/lib/api/utils';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { serializeItemContent } from '@proton/pass/lib/items/item-proto.transformer';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type {
    AliasCreateFromPendingDTO,
    AliasDetails,
    AliasMailbox,
    AliasOptions,
    AliasPending,
    AliasToggleStatusDTO,
    CreatePendingAliasRequest,
    EnableSLSyncRequest,
    ItemRevisionContentsResponse,
    SlSyncStatusOutput,
} from '@proton/pass/types';
import chunk from '@proton/utils/chunk';

export const getAliasOptions = async (shareId: string): Promise<AliasOptions> => {
    const aliasOptions = await api({
        url: `pass/v1/share/${shareId}/alias/options`,
        method: 'get',
    }).then(({ Options }) => {
        if (!Options) throw new Error(c('Error').t`Alias options could not be resolved`);
        return Options;
    });

    const options: AliasOptions = {
        suffixes: aliasOptions.Suffixes.map((data) => ({
            signedSuffix: data.SignedSuffix!,
            suffix: data.Suffix!,
            isCustom: data.IsCustom!,
            domain: data.Domain!,
        })),
        mailboxes: aliasOptions.Mailboxes.map((mailbox) => ({
            email: mailbox.Email,
            id: mailbox.ID,
        })),
    };

    return options;
};

export const getAliasDetails = async (shareId: string, itemId: string): Promise<AliasDetails> => {
    const result = await api({
        url: `pass/v1/share/${shareId}/alias/${itemId}`,
        method: 'get',
    });

    return {
        aliasEmail: result.Alias!.Email,
        mailboxes: result.Alias!.Mailboxes.map(({ Email, ID }): AliasMailbox => ({ id: ID, email: Email })),
    };
};

export const getAliasCount = async (): Promise<number> =>
    (await api({ url: `pass/v1/user/alias/count`, method: 'get' }))?.AliasCount?.Total ?? 0;

export const getAliasSyncStatus = async (): Promise<SlSyncStatusOutput> => {
    const result = (await api({ url: `pass/v1/alias_sync/status`, method: 'get' }))?.SyncStatus;
    return result ?? { PendingAliasCount: 0, Enabled: false };
};

export const enableAliasSync = async (data: EnableSLSyncRequest) =>
    api({
        url: `pass/v1/alias_sync/sync`,
        method: 'post',
        data,
    });

export const getPendingAliases = async (): Promise<AliasPending[]> =>
    createPageIterator({
        request: async (cursor) => {
            const result = await api({ url: `pass/v1/alias_sync/pending`, method: 'get', params: { Since: cursor } });
            const pending = (result.PendingAliases?.Aliases ?? []).map<AliasPending>((pending) => ({
                aliasEmail: pending.AliasEmail!,
                pendingAliasID: pending.PendingAliasID!,
                aliasNote: pending.AliasNote!,
            }));

            return { data: pending, cursor: result.PendingAliases?.LastToken };
        },
    })();

export const createAliasesFromPending = async ({
    shareId,
    pendingAliases,
}: AliasCreateFromPendingDTO): Promise<ItemRevisionContentsResponse[]> => {
    const encryptedItems: CreatePendingAliasRequest[] = await Promise.all(
        pendingAliases.map(async (alias) => {
            const { pendingAliasID: PendingAliasID, aliasEmail: name, aliasNote: note = '' } = alias;

            const item = itemBuilder('alias');
            item.set('metadata', (metadata) => metadata.merge({ name, note }));
            const content = serializeItemContent(item.data);
            const aliasItem = await PassCrypto.createItem({ shareId, content });

            return { PendingAliasID, Item: aliasItem };
        })
    );

    const aliases = await Promise.all(
        chunk(encryptedItems, MAX_BATCH_PER_REQUEST).map(
            async (Items) =>
                (
                    await api({
                        url: `pass/v1/alias_sync/share/${shareId}/create`,
                        method: 'post',
                        data: { Items },
                    })
                ).Revisions?.RevisionsData!
        )
    );

    return aliases.flat();
};

export const toggleAliasStatus = async ({ shareId, itemId, enabled }: AliasToggleStatusDTO) =>
    (
        await api({
            url: `pass/v1/share/${shareId}/alias/${itemId}/status`,
            method: 'put',
            data: { Enable: enabled },
        })
    ).Item;
