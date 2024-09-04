import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import store from 'proton-pass-extension/app/worker/store';
import { validateFormCredentials } from 'proton-pass-extension/lib/utils/form-entry';
import { c } from 'ttag';

import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { hasUserIdentifier } from '@proton/pass/lib/items/item.predicates';
import { intoLoginItemPreview } from '@proton/pass/lib/items/item.utils';
import { itemCreationIntent, itemCreationSuccess, itemEditIntent, itemEditSuccess } from '@proton/pass/store/actions';
import {
    selectAutosaveCandidate,
    selectAutosaveVault,
    selectItem,
    selectWritableVaults,
} from '@proton/pass/store/selectors';
import type { AutosavePrompt, FormEntry } from '@proton/pass/types';
import { AutosaveMode, WorkerMessageType } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { isValidURL } from '@proton/pass/utils/url/is-valid-url';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

export const createAutoSaveService = () => {
    const resolve = ({ type, data, domain, subdomain }: FormEntry): AutosavePrompt => {
        /* If credentials are not valid for the form type : exit early */
        if (!validateFormCredentials(data, { type, partial: false })) return { shouldPrompt: false };

        const { userIdentifier, password } = data;
        const state = store.getState();
        const shareIds = selectWritableVaults(store.getState()).map(prop('shareId'));

        if (type === 'register') {
            const candidates = selectAutosaveCandidate({ domain, subdomain, userIdentifier: '', shareIds })(state);
            const pwMatch = candidates.filter((item) => deobfuscate(item.data.content.password) === password);
            const fullMatch = Boolean(userIdentifier) && pwMatch.some(hasUserIdentifier(userIdentifier));

            /* The credentials may have been saved during the password-autosuggest autosave
             * sequence - as such ensure we don't have an exact username/password match */
            if (fullMatch) return { shouldPrompt: false };
            if (pwMatch.length > 0) {
                return {
                    shouldPrompt: true,
                    data: { type: AutosaveMode.UPDATE, candidates: pwMatch.map(intoLoginItemPreview) },
                };
            } else return { shouldPrompt: true, data: { type: AutosaveMode.NEW } };
        }

        /* If no login items found for the current domain & the
         * current username - prompt for autosaving a new entry */
        const candidates = selectAutosaveCandidate({ domain, subdomain, userIdentifier, shareIds })(state);
        if (candidates.length === 0) return { shouldPrompt: true, data: { type: AutosaveMode.NEW } };

        /* If we cannot find an entry which also matches the current submission's
         * password then we should prompt for update */
        const match = candidates.some((item) => deobfuscate(item.data.content.password) === password);

        return match
            ? { shouldPrompt: false }
            : {
                  shouldPrompt: true,
                  data: { type: AutosaveMode.UPDATE, candidates: candidates.map(intoLoginItemPreview) },
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
                .set('password', payload.password)
                .set('urls', valid ? [url] : [])
                .set('passkeys', payload.passkey ? [payload.passkey] : []);

            // TODO: migrate to use Rust's email validation
            if (validateEmailAddress(payload.userIdentifier)) {
                item.get('content').set('itemEmail', payload.userIdentifier);
            } else {
                item.get('content').set('itemUsername', payload.userIdentifier);
            }

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

            const currentItem = selectItem<'login'>(shareId, itemId)(state);
            if (!currentItem) throw new Error(c('Error').t`Item does not exist`);

            const item = itemBuilder('login', currentItem.data);
            const { passkey } = payload;

            item.get('metadata').set('name', payload.name);

            item.get('content')
                .set('password', (password) => (passkey ? password : payload.password))
                .set('urls', (urls) => Array.from(new Set(urls.concat(valid ? [url] : []))))
                .set('passkeys', (passkeys) => (passkey ? [...passkeys, passkey] : passkeys));

            // TODO: migrate to use Rust's email validation
            const isEmail = validateEmailAddress(payload.userIdentifier);
            const userIdKey = isEmail ? 'itemEmail' : 'itemUsername';

            item.get('content').set(userIdKey, (value) => (passkey ? value : payload.userIdentifier));

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
