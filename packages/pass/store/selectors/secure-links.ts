import { createSelector } from '@reduxjs/toolkit';

import type { SecureLink } from '../../types';
import { prop } from '../../utils/fp/lens';
import { not } from '../../utils/fp/predicates';
import { sortOn } from '../../utils/fp/sort';
import { objectEntries } from '../../utils/object/generic';
import type { State } from '../types';
import { createVisibilityFilterSelector } from './shares';

export const selectSecureLinksState = (state: State) => state.items.secureLinks;

const selectSecureLinkedItems = createSelector(selectSecureLinksState, (state) =>
    objectEntries(state).flatMap(([shareId, byItemId]) => objectEntries(byItemId).map(([itemId, links]) => ({ shareId, itemId, links })))
);

export const selectAllSecureLinks = createSelector(selectSecureLinkedItems, (entries) => entries.flatMap(({ links }) => links));
export const selectVisibleSecureLinks = createVisibilityFilterSelector(selectAllSecureLinks);
export const selectVisibleSecureLinkedItems = createVisibilityFilterSelector(selectSecureLinkedItems);
export const selectVisibleSecureLinksCount = createSelector([selectVisibleSecureLinks], prop('length'));
export const selectActiveSecureLinksCount = createSelector(selectVisibleSecureLinks, (links) => links.filter(prop('active')).length);
export const selectInactiveSecureLinksCount = createSelector(selectAllSecureLinks, (links) => links.filter(not(prop('active'))).length);

export const selectItemSecureLinks = (shareId: string, itemId: string) =>
    createSelector(selectSecureLinksState, (secureLinks): SecureLink[] =>
        (secureLinks[shareId]?.[itemId] ?? []).slice().sort(sortOn('active', 'DESC'))
    );

export const selectSecureLinksByShareId = (shareId: string) =>
    createSelector(selectSecureLinksState, (secureLinks): SecureLink[] => Object.values(secureLinks?.[shareId] ?? {}).flat());
