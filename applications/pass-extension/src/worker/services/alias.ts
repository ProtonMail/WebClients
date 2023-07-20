import { c } from 'ttag';

import type { AliasState } from '@proton/pass/store';
import {
    aliasOptionsRequestSuccess,
    aliasOptionsRequested,
    itemCreationFailure,
    itemCreationIntent,
    itemCreationSuccess,
    selectAliasLimits,
    selectPrimaryVault,
} from '@proton/pass/store';
import type { ItemCreateIntent } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import WorkerMessageBroker from '../channel';
import store from '../store';

export const createAliasService = () => {
    /* when resolving alias options for this message type, set the
     * the `needsUpgrade` accordingly for content-scripts to display
     * the upselling UI when alias limits have been reached */
    WorkerMessageBroker.registerMessage(WorkerMessageType.ALIAS_OPTIONS, async () => {
        const { needsUpgrade } = selectAliasLimits(store.getState());
        const primaryVault = selectPrimaryVault(store.getState());

        return {
            needsUpgrade,
            options: await new Promise<AliasState['aliasOptions']>((resolve) =>
                store.dispatch(
                    aliasOptionsRequested({ shareId: primaryVault.shareId }, (result) =>
                        resolve(aliasOptionsRequestSuccess.match(result) ? result.payload.options : null)
                    )
                )
            ),
        };
    });

    WorkerMessageBroker.registerMessage(WorkerMessageType.ALIAS_CREATE, async (message) => {
        const defaultVault = selectPrimaryVault(store.getState());
        const { url, alias } = message.payload;
        const { mailboxes, prefix, signedSuffix, aliasEmail } = alias;
        const optimisticId = uniqueId();

        const aliasCreationIntent: ItemCreateIntent<'alias'> = {
            type: 'alias',
            optimisticId,
            shareId: defaultVault.shareId,
            createTime: getEpoch(),
            metadata: {
                name: url,
                note: c('Placeholder').t`Used on ${url}`,
                itemUuid: optimisticId,
            },
            content: {},
            extraFields: [],
            extraData: {
                mailboxes: mailboxes,
                prefix,
                signedSuffix,
                aliasEmail,
            },
        };

        return new Promise((resolve) =>
            store.dispatch(
                itemCreationIntent(aliasCreationIntent, (intentResultAction) => {
                    if (itemCreationSuccess.match(intentResultAction)) {
                        return resolve({ ok: true });
                    }

                    if (itemCreationFailure.match(intentResultAction)) {
                        const errorMessage =
                            intentResultAction.payload.error instanceof Error
                                ? getApiErrorMessage(intentResultAction.payload.error)
                                : undefined;
                        return resolve({ ok: false, reason: errorMessage ?? '' });
                    }

                    return resolve({ ok: false, reason: '' });
                })
            )
        );
    });

    return {};
};

export type AliasService = ReturnType<typeof createAliasService>;
