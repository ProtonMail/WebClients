import { itemCreationIntent, itemCreationSuccess, itemEditIntent, itemEditSuccess } from '@proton/pass/store/actions';
import { selectAutosaveCandidate, selectAutosaveVault } from '@proton/pass/store/selectors';
import type { AutoSavePromptOptions, FormEntry, FormEntryStatus } from '@proton/pass/types';
import { AutoSaveType, WorkerMessageType } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import WorkerMessageBroker from '../channel';
import store from '../store';

export const createAutoSaveService = () => {
    const resolvePromptOptions = (submission: FormEntry<FormEntryStatus.COMMITTED>): AutoSavePromptOptions => {
        const candidates = selectAutosaveCandidate({
            domain: submission.domain,
            subdomain: submission.subdomain,
            username: submission.data.username,
        })(store.getState());

        /* If no login items found for the current domain & the current
         * username - prompt for autosaving a new entry */
        if (candidates.length === 0) return { shouldPrompt: true, data: { action: AutoSaveType.NEW } };

        /* If we cannot find an entry which also matches the current submission's
         * password then we should prompt for update */
        const match = candidates.filter((item) => deobfuscate(item.data.content.password) === submission.data.password);

        return match.length > 0
            ? { shouldPrompt: false }
            : {
                  shouldPrompt: true,
                  data: {
                      action: AutoSaveType.UPDATE,
                      item: first(candidates)!,
                  },
              };
    };

    WorkerMessageBroker.registerMessage(WorkerMessageType.AUTOSAVE_REQUEST, async ({ payload }) => {
        const autosave = payload.submission.autosave.data;

        if (autosave.action === AutoSaveType.NEW) {
            const selectedVault = selectAutosaveVault(store.getState());

            return new Promise<boolean>((resolve) =>
                store.dispatch(
                    itemCreationIntent(
                        {
                            ...payload.item,
                            optimisticId: uniqueId(),
                            shareId: selectedVault.shareId,
                            createTime: getEpoch(),
                            extraData: { withAlias: false },
                        },
                        (intentResultAction) =>
                            itemCreationSuccess.match(intentResultAction) ? resolve(true) : resolve(false)
                    )
                )
            );
        }

        if (autosave.action === AutoSaveType.UPDATE) {
            const { itemId, shareId, revision: lastRevision } = autosave.item;

            return new Promise<boolean>((resolve) =>
                store.dispatch(
                    itemEditIntent({ ...payload.item, itemId, shareId, lastRevision }, (intentResultAction) =>
                        itemEditSuccess.match(intentResultAction) ? resolve(true) : resolve(false)
                    )
                )
            );
        }

        return false;
    });

    return { resolvePromptOptions };
};

export type AutoSaveService = ReturnType<typeof createAutoSaveService>;
