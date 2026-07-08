import { hasUserIdentifier } from '@proton/pass/lib/items/item.predicates';
import type { SelectAutosaveCandidatesOptions } from '@proton/pass/lib/search/types';
import { searchItemsByDomain } from '@proton/pass/lib/urls/search/match';
import { selectAllItems } from '@proton/pass/store/selectors/items';
import { selectFeatureFlag } from '@proton/pass/store/selectors/user';
import { createUncachedSelector } from '@proton/pass/store/selectors/utils';
import { PassFeature } from '@proton/pass/types/api/features';

export const selectAutosaveCandidate = (options: SelectAutosaveCandidatesOptions) =>
    createUncachedSelector(
        [selectAllItems, () => options, selectFeatureFlag(PassFeature.PassAutofillUrlRegex)],
        (items, { userIdentifier, shareIds }, regexEnabled) => {
            const candidates = searchItemsByDomain(options.domain, items, { shareIds, sortOn: 'lastUseTime', regexEnabled });
            if (!userIdentifier) return candidates;
            return candidates.filter(hasUserIdentifier(userIdentifier));
        }
    );
