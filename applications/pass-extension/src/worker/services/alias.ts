import { c } from 'ttag';

import {
    AliasState,
    aliasOptionsRequestSuccess,
    aliasOptionsRequested,
    itemCreationIntent,
    itemCreationSuccess,
    selectPrimaryVault,
} from '@proton/pass/store';
import type { ItemCreateIntent } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time';

import WorkerMessageBroker from '../channel';
import store from '../store';

export const createAliasService = () => {
    WorkerMessageBroker.registerMessage(WorkerMessageType.ALIAS_OPTIONS, async () => {
        const defaultVault = selectPrimaryVault(store.getState());

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

    WorkerMessageBroker.registerMessage(WorkerMessageType.ALIAS_CREATE, async (message) => {
        const defaultVault = selectPrimaryVault(store.getState());
        const { realm, alias } = message.payload;
        const { mailboxes, prefix, signedSuffix, aliasEmail } = alias;
        const optimisticId = uniqueId();

        const aliasCreationIntent: ItemCreateIntent<'alias'> = {
            type: 'alias',
            optimisticId,
            shareId: defaultVault.shareId,
            createTime: getEpoch(),
            metadata: {
                name: realm,
                note: c('Placeholder').t`Used on ${realm}`,
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
