import { c } from 'ttag';

import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { resolveDefaultItemName } from '@proton/pass/lib/items/item.utils';
import { requestAliasOptions } from '@proton/pass/store/actions/creators/alias';
import { itemCreate } from '@proton/pass/store/actions/creators/item';
import { selectAliasLimits } from '@proton/pass/store/selectors/limits';
import { selectOrganizationSettings } from '@proton/pass/store/selectors/organization';
import { selectMostRecentVaultShareID } from '@proton/pass/store/selectors/vaults';
import { OrganizationAliasCreateMode } from '@proton/pass/types';
import type { ItemCreateIntent } from '@proton/pass/types/data/items.dto';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { WorkerMessageType } from '../../../types/messages';
import WorkerMessageBroker from '../channel';
import { onContextReady, withContext } from '../context/inject';

export const createAliasService = () => {
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOSUGGEST_ALIAS,
        withContext((ctx) => {
            const state = ctx.service.store.getState();
            const orgSettings = selectOrganizationSettings(state);
            const aliasCreationDisabled = orgSettings?.AliasCreateMode === OrganizationAliasCreateMode.NOBODY;
            return { aliasCreationDisabled };
        })
    );

    /* when resolving alias options for this message type, set the
     * the `needsUpgrade` accordingly for content-scripts to display
     * the upselling UI when alias limits have been reached */
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.ALIAS_OPTIONS,
        onContextReady((ctx) => {
            const state = ctx.service.store.getState();
            const shareId = selectMostRecentVaultShareID(state) ?? '';
            if (!shareId) throw new Error("Could not resolve user's default vault.");

            const { needsUpgrade } = selectAliasLimits(state);
            const orgSettings = selectOrganizationSettings(state);
            const aliasCreationDisabled = orgSettings?.AliasCreateMode === OrganizationAliasCreateMode.NOBODY;

            return ctx.service.store.dispatchAsyncRequest(requestAliasOptions, shareId).then((res) => {
                switch (res.type) {
                    case 'success':
                        return { ok: true, needsUpgrade, aliasCreationDisabled, options: res.data };
                    case 'failure':
                        return { ok: false, error: res.error.message ?? null };
                }
            });
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.ALIAS_CREATE,
        onContextReady(async (ctx, message, sender) => {
            const state = ctx.service.store.getState();
            const shareId = selectMostRecentVaultShareID(state);
            if (!shareId) throw new Error("Could not resolve user's default vault.");

            const { origin: url, alias } = message.payload;
            const { mailboxes, prefix, signedSuffix, aliasEmail } = alias;
            const optimisticId = uniqueId();
            const name = resolveDefaultItemName({ title: sender.tab?.title, fallback: url });

            const aliasCreationIntent: ItemCreateIntent<'alias'> = {
                type: 'alias',
                optimisticId,
                shareId,
                metadata: {
                    name,
                    note: obfuscate(c('Placeholder').t`Used on ${url}`),
                    itemUuid: optimisticId,
                },
                files: filesFormInitializer(),
                content: {},
                extraFields: [],
                extraData: {
                    mailboxes: mailboxes,
                    prefix,
                    signedSuffix,
                    aliasEmail,
                },
            };

            return ctx.service.store.dispatchAsyncRequest(itemCreate, aliasCreationIntent).then((res) => {
                switch (res.type) {
                    case 'success':
                        return { ok: true };
                    case 'failure':
                        const error = res.error instanceof Error ? (getApiErrorMessage(res.error) ?? null) : null;
                        return { ok: false, error };
                }
            });
        })
    );

    return {};
};

export type AliasService = ReturnType<typeof createAliasService>;
