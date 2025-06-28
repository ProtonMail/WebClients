import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { onContextReady } from 'proton-pass-extension/app/worker/context/inject';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { c } from 'ttag';

import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { itemCreate, requestAliasOptions } from '@proton/pass/store/actions';
import { selectAliasLimits, selectMostRecentVaultShareID } from '@proton/pass/store/selectors';
import { type ItemCreateIntent } from '@proton/pass/types';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';

export const createAliasService = () => {
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

            return ctx.service.store.dispatchAsyncRequest(requestAliasOptions, shareId).then((res) => {
                switch (res.type) {
                    case 'success':
                        return { ok: true, needsUpgrade, options: res.data };
                    case 'failure':
                        return { ok: false, error: res.error.message ?? null };
                }
            });
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.ALIAS_CREATE,
        onContextReady(async (ctx, message) => {
            const state = ctx.service.store.getState();
            const shareId = selectMostRecentVaultShareID(state);
            if (!shareId) throw new Error("Could not resolve user's default vault.");

            const { url, alias } = message.payload;
            const { mailboxes, prefix, signedSuffix, aliasEmail } = alias;
            const optimisticId = uniqueId();

            const aliasCreationIntent: ItemCreateIntent<'alias'> = {
                type: 'alias',
                optimisticId,
                shareId,
                metadata: {
                    name: url,
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
