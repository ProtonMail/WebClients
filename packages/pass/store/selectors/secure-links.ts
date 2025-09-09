import { createSelector } from '@reduxjs/toolkit';

import { createVisibilityFilterSelector } from '@proton/pass/store/selectors/shares';
import type { State } from '@proton/pass/store/types';
import type { SecureLink } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { not } from '@proton/pass/utils/fp/predicates';
import { sortOn } from '@proton/pass/utils/fp/sort';

export const selectSecureLinksState = (state: State) => state.items.secureLinks;

export const selectAllSecureLinks = createSelector(selectSecureLinksState, (byShareId): SecureLink[] =>
    Object.values(byShareId).flatMap((byItemId) => Object.values(byItemId).flat())
);

export const selectVisibleSecureLinks = createVisibilityFilterSelector(selectAllSecureLinks);
export const selectVisibleSecureLinksCount = createSelector([selectVisibleSecureLinks], prop('length'));
export const selectInactiveSecureLinksCount = createSelector(selectAllSecureLinks, (links) => links.filter(not(prop('active'))).length);

export const selectItemSecureLinks = (shareId: string, itemId: string) =>
    createSelector(selectSecureLinksState, (secureLinks): SecureLink[] =>
        (secureLinks[shareId]?.[itemId] ?? []).slice().sort(sortOn('active', 'DESC'))
    );

export const selectSecureLinksByShareId = (shareId: string) =>
    createSelector(selectSecureLinksState, (secureLinks): SecureLink[] => Object.values(secureLinks?.[shareId] ?? {}).flat());
