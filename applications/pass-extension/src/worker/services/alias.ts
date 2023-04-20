import { c } from 'ttag';
import uniqid from 'uniqid';

import {
    AliasState,
    aliasOptionsRequestSuccess,
    aliasOptionsRequested,
    itemCreationIntent,
    itemCreationSuccess,
    selectDefaultVaultOrThrow,
} from '@proton/pass/store';
import type { ItemCreateIntent } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { getEpoch } from '@proton/pass/utils/time';
import { parseSender } from '@proton/pass/utils/url';

import WorkerMessageBroker from '../channel';
import store from '../store';

export const createAliasService = () => {
    WorkerMessageBroker.registerMessage(WorkerMessageType.ALIAS_OPTIONS, async () => {
        const defaultVault = selectDefaultVaultOrThrow(store.getState());

        return {
            options: await new Promise<AliasState['aliasOptions']>((resolve) =>
                store.dispatch(
                    aliasOptionsRequested({ shareId: defaultVault.shareId }, (result) =>
                        resolve(aliasOptionsRequestSuccess.match(result) ? result.payload.options : null)
                    )
                )
            ),
        };
    });

    WorkerMessageBroker.registerMessage(WorkerMessageType.ALIAS_CREATE, async (message, sender) => {
        const defaultVault = selectDefaultVaultOrThrow(store.getState());
        const { realm, subdomain } = parseSender(sender);
        const { mailboxes, prefix, signedSuffix, aliasEmail } = message.payload.alias;
        const url = subdomain ?? realm;
        const optimisticId = uniqid();

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

        return new Promise<boolean>((resolve) =>
            store.dispatch(
                itemCreationIntent(aliasCreationIntent, (intentResultAction) =>
                    itemCreationSuccess.match(intentResultAction) ? resolve(true) : resolve(false)
                )
            )
        );
    });

    return {};
};

export type AliasService = ReturnType<typeof createAliasService>;
