import { c } from 'ttag';

import {
    getAliasOptionsIntent,
    getAliasOptionsSuccess,
    itemCreationIntent,
    itemCreationSuccess,
} from '@proton/pass/store/actions';
import { withRevalidate } from '@proton/pass/store/actions/with-request';
import { selectAliasLimits, selectAutosaveVault } from '@proton/pass/store/selectors';
import type { ItemCreateIntent } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import WorkerMessageBroker from '../channel';
import store from '../store';

export const createAliasService = () => {
    /* when resolving alias options for this message type, set the
     * the `needsUpgrade` accordingly for content-scripts to display
     * the upselling UI when alias limits have been reached */
    WorkerMessageBroker.registerMessage(WorkerMessageType.ALIAS_OPTIONS, async () => {
        const { needsUpgrade } = selectAliasLimits(store.getState());
        const { shareId } = selectAutosaveVault(store.getState());

        return new Promise((resolve) => {
            store.dispatch(
                withRevalidate(
                    getAliasOptionsIntent({ shareId }, (result) => {
                        if (getAliasOptionsSuccess.match(result)) {
                            const { options } = result.payload;
                            return resolve({ ok: true, needsUpgrade, options });
                        }

                        const error = result.error instanceof Error ? getApiErrorMessage(result.error) ?? null : null;
                        return resolve({ ok: false, error });
                    })
                )
            );
        });
    });

    WorkerMessageBroker.registerMessage(WorkerMessageType.ALIAS_CREATE, async (message) => {
        const { shareId } = selectAutosaveVault(store.getState());
        const { url, alias } = message.payload;
        const { mailboxes, prefix, signedSuffix, aliasEmail } = alias;
        const optimisticId = uniqueId();

        const aliasCreationIntent: ItemCreateIntent<'alias'> = {
            type: 'alias',
            optimisticId,
            shareId,
            createTime: getEpoch(),
            metadata: {
                name: url,
                note: obfuscate(c('Placeholder').t`Used on ${url}`),
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
                itemCreationIntent(aliasCreationIntent, (result) => {
                    if (itemCreationSuccess.match(result)) return resolve({ ok: true });

                    const error = result.error instanceof Error ? getApiErrorMessage(result.error) ?? null : null;
                    return resolve({ ok: false, error });
                })
            )
        );
    });

    return {};
};

export type AliasService = ReturnType<typeof createAliasService>;
