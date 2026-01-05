import { c } from 'ttag';

import { MAX_MAX_BATCH_PER_REQUEST } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import { createPageIterator } from '@proton/pass/lib/api/utils';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { serializeItemContent } from '@proton/pass/lib/items/item-proto.transformer';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type {
    AliasContactBlockDTO,
    AliasContactGetResponse,
    AliasContactInfoDTO,
    AliasContactNewDTO,
    AliasContactWithStatsGetResponse,
    AliasCreateFromPendingDTO,
    AliasDetails,
    AliasMailbox,
    AliasMailboxResponse,
    AliasOptions,
    AliasPending,
    AliasToggleStatusDTO,
    CatchAllDTO,
    CreatePendingAliasRequest,
    CustomDomainMailboxesDTO,
    CustomDomainNameDTO,
    CustomDomainOutput,
    EnableSLSyncRequest,
    ItemRevisionContentsResponse,
    MailboxDTO,
    MailboxDeleteDTO,
    MailboxEditDTO,
    MaybeNull,
    RandomPrefixDTO,
    SlSyncStatusOutput,
    UniqueItem,
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
            isPremium: data.IsPremium!,
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
    const result = (
        await api({
            url: `pass/v1/share/${shareId}/alias/${itemId}`,
            method: 'get',
        })
    ).Alias!;

    const intoMailbox = ({ Email, ID }: AliasMailboxResponse): AliasMailbox => ({ id: ID, email: Email });

    return {
        aliasEmail: result.Email,
        availableMailboxes: result.AvailableMailboxes?.map(intoMailbox) ?? [],
        mailboxes: result.Mailboxes?.map(intoMailbox) ?? [],
        modify: result.Modify,
        name: result.Name ?? '',
        displayName: result.DisplayName,
        slNote: result.Note ?? '',
        stats: {
            blockedEmails: result.Stats.BlockedEmails,
            forwardedEmails: result.Stats.ForwardedEmails,
            repliedEmails: result.Stats.RepliedEmails,
        },
    };
};

export const aliasGetContactsListApi = ({ shareId, itemId }: UniqueItem): Promise<AliasContactWithStatsGetResponse[]> =>
    createPageIterator({
        request: async (cursor) => {
            const result = await api({
                url: `pass/v1/share/${shareId}/alias/${itemId}/contact`,
                method: 'get',
                params: { Since: cursor },
            });
            const contacts = result.Contacts ?? [];

            return { data: contacts, cursor: result.LastID === 0 ? null : result.LastID?.toString() };
        },
    })();

export const aliasGetContactInfoApi = async ({
    shareId,
    itemId,
    contactId,
}: AliasContactInfoDTO): Promise<AliasContactGetResponse> =>
    (
        await api({
            url: `pass/v1/share/${shareId}/alias/${itemId}/contact/${contactId}`,
            method: 'get',
        })
    ).Contact!;

export const aliasCreateContactApi = async ({ shareId, itemId, name, email }: AliasContactNewDTO) =>
    (
        await api({
            url: `pass/v1/share/${shareId}/alias/${itemId}/contact`,
            method: 'post',
            data: { Name: name, Email: email },
        })
    )?.Contact!;

export const aliasDeleteContactApi = ({ shareId, itemId, contactId }: AliasContactInfoDTO) =>
    api({
        url: `pass/v1/share/${shareId}/alias/${itemId}/contact/${contactId}`,
        method: 'delete',
    }).then(() => contactId);

export const aliasBlockContactApi = async ({ shareId, itemId, contactId, blocked }: AliasContactBlockDTO) =>
    (
        await api({
            url: `pass/v1/share/${shareId}/alias/${itemId}/contact/${contactId}/blocked`,
            method: 'put',
            data: { Blocked: blocked },
        })
    )?.Contact!;

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
            const { pendingAliasID: PendingAliasID, aliasEmail: name } = alias;

            const item = itemBuilder('alias');
            item.set('metadata', (metadata) => metadata.merge({ name }));
            const content = serializeItemContent(item.data);
            const aliasItem = await PassCrypto.createItem({ shareId, content });

            return { PendingAliasID, Item: aliasItem };
        })
    );

    const aliases = await Promise.all(
        chunk(encryptedItems, MAX_MAX_BATCH_PER_REQUEST).map(
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

export const getMailboxesApi = async () =>
    (
        await api({
            url: `pass/v1/user/alias/mailbox`,
            method: 'get',
        })
    ).Mailboxes!;

export const createMailboxApi = async (email: string) =>
    (
        await api({
            url: `pass/v1/user/alias/mailbox`,
            method: 'post',
            data: { Email: email },
        })
    ).Mailbox!;

export const resendVerifyMailboxApi = async (mailboxID: number) =>
    (
        await api({
            url: `pass/v1/user/alias/mailbox/${mailboxID}/verify`,
            method: 'get',
        })
    ).Mailbox!;

export const validateMailboxApi = async ({ mailboxID, code }: { mailboxID: number; code: string }) => {
    return (
        await api({
            url: `pass/v1/user/alias/mailbox/${mailboxID}/verify`,
            method: 'post',
            data: { Code: code },
        })
    ).Mailbox!;
};

export const deleteMailboxApi = async (dto: MailboxDeleteDTO) =>
    api({
        url: `pass/v1/user/alias/mailbox/${dto.mailboxID}`,
        method: 'delete',
        data: { TransferMailboxID: dto.transferMailboxID },
    }).then(() => dto);

export const editMailboxApi = async ({ mailboxID, email }: MailboxEditDTO) =>
    (
        await api({
            url: `pass/v1/user/alias/mailbox/${mailboxID}/email`,
            method: 'put',
            data: { Email: email },
        })
    ).Mailbox;

export const cancelMailboxEditApi = async (mailboxID: number) =>
    api({
        url: `pass/v1/user/alias/mailbox/${mailboxID}/email`,
        method: 'delete',
    }).then(() => mailboxID);

export const setDefaultMailboxApi = async ({ mailboxID: DefaultMailboxID }: MailboxDTO) =>
    (
        await api({
            url: 'pass/v1/user/alias/settings/default_mailbox_id',
            method: 'put',
            data: { DefaultMailboxID },
        })
    ).Settings!;

export const getAliasDomainsApi = async () =>
    (
        await api({
            url: `pass/v1/user/alias/domain`,
            method: 'get',
        })
    ).Domains!;

export const syncAliasMailboxes = ({ shareId, itemId }: UniqueItem, MailboxIDs: number[]) =>
    api({
        url: `pass/v1/share/${shareId}/alias/${itemId}/mailbox`,
        method: 'post',
        data: { MailboxIDs },
    });

export const syncAliasName = ({ shareId, itemId }: UniqueItem, Name: string) =>
    api({
        url: `pass/v1/share/${shareId}/alias/${itemId}/name`,
        method: 'put',
        data: { Name },
    });

export const syncAliasSLNote = ({ shareId, itemId }: UniqueItem, Note: string) =>
    api({
        url: `pass/v1/share/${shareId}/alias/${itemId}/note`,
        method: 'put',
        data: { Note },
    });

export const setDefaultAliasDomainApi = async (domain: MaybeNull<string>) =>
    (
        await api({
            url: 'pass/v1/user/alias/settings/default_alias_domain',
            method: 'put',
            data: { DefaultAliasDomain: domain },
        })
    ).Settings!;

export const getCustomDomainsApi = async (): Promise<CustomDomainOutput[]> =>
    createPageIterator({
        request: async (LastID) => {
            const result = await api({
                url: `pass/v1/user/alias/custom_domain`,
                method: 'get',
                params: { LastID },
            });

            const domains = result.CustomDomains?.Domains ?? [];
            const cursor = result.CustomDomains?.LastID;
            const total = result.CustomDomains?.Total ?? 0;

            /* BE may return a non-null LastID even if there is no
             * next page, so we set the cursor to null in that case */
            if (domains.length >= total) {
                return { data: domains, cursor: null };
            }

            return { data: domains, cursor: cursor?.toString() };
        },
    })();

export const getCustomDomainInfoApi = async (domainID: number) =>
    (
        await api({
            url: `pass/v1/user/alias/custom_domain/${domainID}`,
            method: 'get',
        })
    ).CustomDomain!;

export const createCustomDomainApi = async (domain: string) =>
    (
        await api({
            url: `pass/v1/user/alias/custom_domain`,
            method: 'post',
            data: { Domain: domain },
        })
    ).CustomDomain!;

export const verifyCustomDomainApi = async (domainID: number) =>
    (
        await api({
            url: `pass/v1/user/alias/custom_domain/${domainID}`,
            method: 'post',
        })
    ).CustomDomainValidation!;

export const deleteCustomDomainApi = async (domainID: number) =>
    api({
        url: `pass/v1/user/alias/custom_domain/${domainID}`,
        method: 'delete',
    }).then(() => domainID);

export const getCustomDomainSettingsApi = async (domainID: number) =>
    (
        await api({
            url: `pass/v1/user/alias/custom_domain/${domainID}/settings`,
            method: 'get',
        })
    ).Settings!;

export const updateCatchAllApi = async ({ domainID, catchAll }: CatchAllDTO) =>
    (
        await api({
            url: `pass/v1/user/alias/custom_domain/${domainID}/settings/catch_all`,
            method: 'put',
            data: { CatchAll: catchAll },
        })
    ).Settings!;

export const updateCustomDomainDisplayNameApi = async ({ domainID, name }: CustomDomainNameDTO) =>
    (
        await api({
            url: `pass/v1/user/alias/custom_domain/${domainID}/settings/name`,
            method: 'put',
            data: { Name: name },
        })
    ).Settings!;

export const updateRandomPrefixApi = async ({ domainID, randomPrefix }: RandomPrefixDTO) =>
    (
        await api({
            url: `pass/v1/user/alias/custom_domain/${domainID}/settings/random_prefix`,
            method: 'put',
            data: { RandomPrefixGeneration: randomPrefix },
        })
    ).Settings!;

export const updateCustomDomainMailboxesApi = async ({ domainID, mailboxIDs }: CustomDomainMailboxesDTO) =>
    (
        await api({
            url: `pass/v1/user/alias/custom_domain/${domainID}/settings/mailboxes`,
            method: 'put',
            data: { MailboxIDs: mailboxIDs },
        })
    ).Settings!;
