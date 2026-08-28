import { c } from 'ttag';

import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import { hasUserIdentifier, matchesLoginPassword } from '@proton/pass/lib/items/item.predicates';
import { intoLoginItemPreview } from '@proton/pass/lib/items/item.utils';
import { ItemUrlMatch, getItemPriorityForUrl } from '@proton/pass/lib/urls/search/match-url';
import type { ParsedUrl } from '@proton/pass/lib/urls/types';
import { parseUrl } from '@proton/pass/lib/urls/utils/parser';
import { intoDomainWithPort } from '@proton/pass/lib/urls/utils/utils';
import { itemCreate, itemEdit } from '@proton/pass/store/actions/creators/item';
import { selectAutosaveCandidate } from '@proton/pass/store/selectors/autosave';
import { selectNonOptimisticItem } from '@proton/pass/store/selectors/items';
import { selectVisibleWritableShares } from '@proton/pass/store/selectors/shares';
import type { ItemRevision } from '@proton/pass/types';
import { AutofillMode } from '@proton/pass/types/protobuf';
import type { AutosavePrompt } from '@proton/pass/types/worker/autosave';
import { AutosaveMode } from '@proton/pass/types/worker/autosave';
import type { FormEntry } from '@proton/pass/types/worker/form';
import { prop } from '@proton/pass/utils/fp/lens';
import { and } from '@proton/pass/utils/fp/predicates';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

import { validateFormCredentials } from '../../../lib/utils/form-entry';
import { WorkerMessageType } from '../../../types/messages';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context/inject';

export const createAutoSaveService = () => {
    const resolve = withContext<(entry: FormEntry, url: ParsedUrl) => AutosavePrompt>((ctx, options, url) => {
        const { type, data, domain } = options;

        /* Validate form data completeness before processing */
        if (!validateFormCredentials(data, { type, partial: false })) return { shouldPrompt: false };

        const { userIdentifier, password } = data;
        const state = ctx.service.store.getState();
        const writableShareIds = selectVisibleWritableShares(state).map(prop('shareId'));

        /** Reuses the canonical matching engine instead of a bespoke domain/port/protocol
         * equality check, so "already exists here" agrees with what autofill itself would
         * match. `regexEnabled: false` is a pure optimization here, not a behavior change:
         * Pattern/RegularExpression modes can only ever reach `SUB_MATCH`, below the
         * `TOP_MATCH` threshold, so they'd never satisfy this check regardless. */
        const matchesCurrentUrl = (item: ItemRevision<'login'>) =>
            getItemPriorityForUrl(url, item, { strict: false, regexEnabled: false }) >= ItemUrlMatch.TOP_MATCH;

        if (type === 'register') {
            /** For registration forms, search for matching entries in the
             * current domain without specifying a `userIdentifier`. This
             * will allow detecting partial matches. */
            const candidates = selectAutosaveCandidate({ domain, shareIds: writableShareIds })(state);
            const pwMatches = candidates.filter(matchesLoginPassword(password));

            /** A complete match requires both:
             * - A matching `userIdentifier`
             * - A matching URL (including protocol and port) */
            const exactMatch =
                Boolean(userIdentifier) && pwMatches.some(and(hasUserIdentifier(userIdentifier), matchesCurrentUrl));

            /** Skip if exact credentials already exist to prevent duplicates.
             * This can occur when password autosuggest triggers an autosave
             * request before this autosave request is processed. */
            if (exactMatch) return { shouldPrompt: false };

            /** If we found entries that match only by password but not
             * by full credentials, suggest updating those entries. */
            if (pwMatches.length > 0) {
                return {
                    shouldPrompt: true,
                    data: {
                        type: AutosaveMode.UPDATE,
                        candidates: pwMatches.map(intoLoginItemPreview),
                    },
                };
            }

            /** No candidates found - prompt to save as new credentials  */
            return { shouldPrompt: true, data: { type: AutosaveMode.NEW } };
        }

        /** First check for existing login items across all shares(including
         * read-only). This will ensure we don't create duplicates when credentials
         * exist in a read-only vault that the user is currently accessing */
        const candidates = selectAutosaveCandidate({ domain, userIdentifier })(state);

        /** No candidates found - prompt to save as new credentials */
        if (candidates.length === 0) return { shouldPrompt: true, data: { type: AutosaveMode.NEW } };

        /** If any share (writable or read-only) contains an exact credential
         * match, skip the autosave prompt to prevent duplicates. */
        const exactMatch = candidates.some(and(matchesLoginPassword(password), matchesCurrentUrl));
        if (exactMatch) return { shouldPrompt: false };

        /** Filter on only writable shares for potential updates */
        const writableCandidates = candidates
            .filter(({ shareId }) => writableShareIds.includes(shareId))
            .map(intoLoginItemPreview);

        /* If matching entries were found but passwords or full url differ,
         * prompt the user to update the existing entries. */
        if (writableCandidates.length > 0) {
            return {
                shouldPrompt: true,
                data: { type: AutosaveMode.UPDATE, candidates: writableCandidates },
            };
        }

        /** No candidates found - prompt to save as new credentials */
        return { shouldPrompt: true, data: { type: AutosaveMode.NEW } };
    });

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOSAVE_REQUEST,
        withContext(async (ctx, { payload }, sender) => {
            const state = ctx.service.store.getState();

            /** - For sub-frame autosaves, we save the login for the iframe URL and not the page embedding it.
             * - Top-frame autosaves have no `iframeUrl` and use `sender.tab.url`. */
            const { domain, subdomain, port, protocol } = parseUrl(payload.iframeUrl ?? sender.tab?.url);
            const url = intoDomainWithPort({ domain: subdomain ?? domain, port, protocol });

            if (payload.type === AutosaveMode.NEW) {
                const item = itemBuilder('login');
                const content = item.get('content');

                item.get('metadata')
                    .set('name', payload.name)
                    .set('note', c('Info').t`Autosaved on ${url}`);

                content
                    .set('password', payload.password)
                    .set('autofillUrls', url ? [{ url, mode: AutofillMode.Default }] : [])
                    .set('passkeys', payload.passkey ? [payload.passkey] : []);

                // TODO: migrate to use Rust's email validation
                if (validateEmailAddress(payload.userIdentifier)) content.set('itemEmail', payload.userIdentifier);
                else content.set('itemUsername', payload.userIdentifier);

                return ctx.service.store
                    .dispatchAsyncRequest(itemCreate, {
                        ...item.data,
                        extraData: { withAlias: false },
                        optimisticId: payload.optimisticId,
                        shareId: payload.shareId,
                        files: filesFormInitializer(),
                    })
                    .then((res) => res.type === 'success');
            }

            if (payload.type === AutosaveMode.UPDATE) {
                const { shareId, itemId } = payload;

                /** Do not unwrap optimistic state during autosave service
                 * updates. We increment revision numbers optimistically but
                 * don't track failed actions in this service (unlike in UI).*/
                const currentItem = selectNonOptimisticItem<'login'>(shareId, itemId)(state);
                if (!currentItem) throw new Error(c('Error').t`Item does not exist`);

                const item = itemBuilder('login', currentItem.data);
                const content = item.get('content');
                const { passkey } = payload;

                item.get('metadata').set('name', payload.name);

                content
                    .set('password', (password) => (passkey ? password : payload.password))
                    .set('autofillUrls', (autofillUrls) => {
                        if (url && !autofillUrls.some((autofillUrl) => autofillUrl.url === url)) {
                            return [...autofillUrls, { url, mode: AutofillMode.Default }];
                        }
                        return autofillUrls;
                    })
                    .set('passkeys', (passkeys) => (passkey ? [...passkeys, passkey] : passkeys));

                // TODO: migrate to use Rust's email validation
                const isEmail = validateEmailAddress(payload.userIdentifier);
                const userIdKey = isEmail ? 'itemEmail' : 'itemUsername';
                content.set(userIdKey, (value) => (passkey ? value : payload.userIdentifier));

                return ctx.service.store
                    .dispatchAsyncRequest(itemEdit, {
                        ...item.data,
                        lastRevision: currentItem.revision,
                        itemId,
                        shareId,
                        files: filesFormInitializer(),
                    })
                    .then((res) => res.type === 'success');
            }

            return false;
        })
    );

    return { resolve };
};

export type AutoSaveService = ReturnType<typeof createAutoSaveService>;
