import type { BookmarkItem, DirectShareItem, InvitationItem, SharedWithMeItem } from '../useSharedWithMe.store';
import type { ItemTypeChecker } from './actionsItemsChecker';

function isTypedArrayTrusted<T extends SharedWithMeItem>(items: SharedWithMeItem[], condition: boolean): items is T[] {
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
