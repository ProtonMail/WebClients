import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import store from 'proton-pass-extension/app/worker/store';
import { validateFormCredentials } from 'proton-pass-extension/lib/utils/form-entry';
import { c } from 'ttag';

import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { intoSafeLoginItem } from '@proton/pass/lib/items/item.utils';
import { itemCreationIntent, itemCreationSuccess, itemEditIntent, itemEditSuccess } from '@proton/pass/store/actions';
import { selectAutosaveCandidate, selectAutosaveVault, selectItemByShareIdAndId } from '@proton/pass/store/selectors';
import type { AutosavePrompt, FormEntry } from '@proton/pass/types';
import { AutosaveMode, WorkerMessageType } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { isValidURL } from '@proton/pass/utils/url/is-valid-url';

export const createAutoSaveService = () => {
    const resolve = ({ type, data, domain, subdomain }: FormEntry): AutosavePrompt => {
        /* If credentials are not valid for the form type : exit early */
        if (!validateFormCredentials(data, { type, partial: false })) return { shouldPrompt: false };

        /* If the form was of type `register` we should always
         * ask the user to create a new item. Ideally for `NOOP`
         * forms as well but we are still getting too many false
         * positives on password-change form detections. */
        if (type === 'register') return { shouldPrompt: true, data: { type: AutosaveMode.NEW } };

        const { username, password } = data;
        const candidates = selectAutosaveCandidate({ domain, subdomain, username })(store.getState());

        /* If no login items found for the current domain & the
         * current username - prompt for autosaving a new entry */
        if (candidates.length === 0) return { shouldPrompt: true, data: { type: AutosaveMode.NEW } };

        /* If we cannot find an entry which also matches the current submission's
         * password then we should prompt for update */
        const match = candidates.some((item) => deobfuscate(item.data.content.password) === password);

        return match
            ? { shouldPrompt: false }
            : {
                  shouldPrompt: true,
                  data: { type: AutosaveMode.UPDATE, candidates: candidates.map(intoSafeLoginItem) },
              };
    };

    WorkerMessageBroker.registerMessage(WorkerMessageType.AUTOSAVE_REQUEST, async ({ payload }) => {
        const state = store.getState();
        const { valid, url } = isValidURL(payload.domain);

        if (payload.type === AutosaveMode.NEW) {
            const selectedVault = selectAutosaveVault(state);
            const item = itemBuilder('login');

            item.get('metadata')
                .set('name', payload.name)
                .set('note', c('Info').t`Autosaved on ${payload.domain}`);

            item.get('content')
                .set('username', payload.username)
                .set('password', payload.password)
                .set('urls', valid ? [url] : [])
                .set('passkeys', payload.passkey ? [payload.passkey] : []);

            return new Promise<boolean>((resolve) =>
                store.dispatch(
                    itemCreationIntent(
                        {
                            ...item.data,
                            createTime: getEpoch(),
                            extraData: { withAlias: false },
                            optimisticId: uniqueId(),
                            shareId: selectedVault.shareId,
                        },
                        (action) => resolve(itemCreationSuccess.match(action))
                    )
                )
            );
        }

        if (payload.type === AutosaveMode.UPDATE) {
            const { shareId, itemId } = payload;

            const currentItem = selectItemByShareIdAndId<'login'>(shareId, itemId)(state);
            if (!currentItem) throw new Error(c('Error').t`Item does not exist`);

            const item = itemBuilder('login', currentItem.data);
            const { passkey } = payload;

            item.get('metadata').set('name', payload.name);

            item.get('content')
                .set('username', (username) => (passkey ? username : payload.username))
                .set('password', (password) => (passkey ? password : payload.password))
                .set('urls', (urls) => Array.from(new Set(urls.concat(valid ? [url] : []))))
                .set('passkeys', (passkeys) => (passkey ? [...passkeys, passkey] : passkeys));

            return new Promise<boolean>((resolve) =>
                store.dispatch(
                    itemEditIntent(
                        {
                            ...item.data,
                            lastRevision: currentItem.revision,
                            itemId,
                            shareId,
                        },
                        (action) => resolve(itemEditSuccess.match(action))
                    )
                )
            );
        }

        return false;
    });

    return { resolve };
};

export type AutoSaveService = ReturnType<typeof createAutoSaveService>;
