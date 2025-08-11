import {
    type BookmarkItem,
    type DirectShareItem,
    type InvitationItem,
    type SharedWithMeListingItemUI,
} from '../../../zustand/sections/sharedWithMeListing.store';
import type { ItemTypeChecker } from './actionsItemsChecker';

function isTypedArrayTrusted<T extends SharedWithMeListingItemUI>(
    items: SharedWithMeListingItemUI[],
    condition: boolean
): items is T[] {
    return condition;
}

export function getBookmarksIfOnly(checker: ItemTypeChecker): BookmarkItem[] | null {
    return isTypedArrayTrusted<BookmarkItem>(checker.items, checker.isOnlyBookmarks) ? checker.items : null;
}

export function getInvitationsIfOnly(checker: ItemTypeChecker): InvitationItem[] | null {
    return isTypedArrayTrusted<InvitationItem>(checker.items, checker.isOnlyInvitations) ? checker.items : null;
}

export function getDirectSharesIfOnly(checker: ItemTypeChecker): DirectShareItem[] | null {
    const isOnlyDirectShares = checker.hasDirectShares && !checker.hasBookmarks && !checker.hasInvitations;
    return isTypedArrayTrusted<DirectShareItem>(checker.items, isOnlyDirectShares) ? checker.items : null;
}
