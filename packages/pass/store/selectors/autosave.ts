import { hasUserIdentifier } from '../../lib/items/item.predicates';
import type { SelectAutosaveCandidatesOptions } from '../../lib/search/types';
import { searchItemsByDomain } from '../../lib/urls/search/match';
import { PassFeature } from '../../types/api/features';
import { selectAllItems } from './items';
import { selectFeatureFlag } from './user';
import { createUncachedSelector } from './utils';

export const selectAutosaveCandidate = (options: SelectAutosaveCandidatesOptions) =>
    createUncachedSelector(
        [selectAllItems, () => options, selectFeatureFlag(PassFeature.PassAutofillUrlRegex)],
        (items, { userIdentifier, shareIds }, regexEnabled) => {
            const candidates = searchItemsByDomain(options.domain, items, { shareIds, sortOn: 'lastUseTime', regexEnabled });
            if (!userIdentifier) return candidates;
            return candidates.filter(hasUserIdentifier(userIdentifier));
        }
    );
