import { hasUserIdentifier } from '@proton/pass/lib/items/item.predicates';
import type { SelectAutosaveCandidatesOptions } from '@proton/pass/lib/search/types';
import { createMatchDomainItemsSelector } from '@proton/pass/store/selectors/match';
import { createUncachedSelector } from '@proton/pass/store/selectors/utils';

export const selectAutosaveCandidate = (options: SelectAutosaveCandidatesOptions) =>
    createUncachedSelector(
        [
            createMatchDomainItemsSelector(options.domain, {
                isPrivate: false,
                port: null,
                protocol: null,
                shareIds: options.shareIds,
                /** Tolerate autosave candidates to be hidden.
                 * Avoids duplicating data unnecessarily */
                visible: false,
            }),
            () => options.userIdentifier,
        ],
        (candidates, userIdentifier) => {
            if (!userIdentifier) return candidates;
            return candidates.filter(hasUserIdentifier(userIdentifier));
        }
    );
