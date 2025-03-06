import { createSelector } from '@reduxjs/toolkit';

import type { State } from '@proton/pass/store/types';
import type { SecureLink } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { not } from '@proton/pass/utils/fp/predicates';
import { sortOn } from '@proton/pass/utils/fp/sort';

export const selectSecureLinks = (state: State) => state.items.secureLinks;

export const selectAllSecureLinks = createSelector(selectSecureLinks, (byShareId): SecureLink[] =>
    Object.values(byShareId).flatMap((byItemId) => Object.values(byItemId).flat())
);

export const selectSecureLinksCount = createSelector(selectAllSecureLinks, (links) => links.length);

export const selectInactiveSecureLinksCount = createSelector(
    selectAllSecureLinks,
    (links) => links.filter(not(prop('active'))).length
);

export const selectItemSecureLinks = (shareId: string, itemId: string) =>
    createSelector(selectSecureLinks, (secureLinks): SecureLink[] =>
        (secureLinks[shareId]?.[itemId] ?? []).slice().sort(sortOn('active', 'DESC'))
    );

export const selectSecureLinksByShareId = (shareId: string) =>
    createSelector(selectSecureLinks, (secureLinks): SecureLink[] =>
        Object.values(secureLinks?.[shareId] ?? {}).flat()
    );
