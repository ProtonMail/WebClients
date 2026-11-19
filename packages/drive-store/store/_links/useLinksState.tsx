import { createContext, useCallback, useContext, useState } from 'react';

import isTruthy from '@proton/utils/isTruthy';

import type { DecryptedLink, EncryptedLink, LinkShareUrl, SignatureIssues } from './interface';
import { isDecryptedLinkSame, isEncryptedLinkSame } from './link';

export type LinksState = {
    [shareId: string]: {
        links: Links;
        tree: Tree;
    };
};

type Links = {
    [linkId: string]: Link;
};

export type Link = {
    encrypted: EncryptedLink;
    decrypted?: DecryptedLink;
};

type Tree = {
    [parentLinkId: string]: string[];
};

/**
 * Returns whether or not a `Link` is decrypted.
 */
export function isLinkDecrypted(link: Link | undefined): link is Required<Link> {
    return !!link && !!link.decrypted && !link.decrypted.isStale;
}

/**
 * useLinksStateProvider provides a storage to cache links.
 */
export function useLinksStateProvider() {
    const [state, setState] = useState<LinksState>({});

    const setLinks = useCallback((shareId: string, links: Link[]) => {
        setState((state) => addOrUpdate(state, shareId, links));
    }, []);

    const getLink = useCallback(
        (shareId: string, linkId: string): Link | undefined => {
            return state[shareId]?.links[linkId];
        },
        [state]
    );

    const getChildren = useCallback(
        (shareId: string, parentLinkId: string, foldersOnly: boolean = false): Link[] => {
            const childrenLinkIds = state[shareId]?.tree[parentLinkId] || [];
            return childrenLinkIds
                .map((linkId) => state[shareId].links[linkId])
                .filter(isTruthy)
                .filter((link) => !foldersOnly || !link.encrypted.isFile);
        },
        [state]
    );

    return {
        setLinks,
        getLink,
        getChildren,
    };
}

export function addOrUpdate(state: LinksState, shareId: string, links: Link[]): LinksState {
    if (!links.length) {
        return state;
    }

    if (!state[shareId]) {
        state[shareId] = {
            links: {},
            tree: {},
        };
    }

    links.forEach((link) => {
        const { linkId, parentLinkId } = link.encrypted;

        const original = state[shareId].links[linkId];
        const originalTrashed = original?.encrypted.trashed;

        // Backend does not return trashed property set for children of trashed
        // parent. For example, file can have trashed equal to null even if its
        // in the folder which is trashed. Its heavy operation on backend and
        // because client needs to load all the parents to get keys anyway, we
        // can calculate it here.
        // Note this can be problematic in the future once we dont keep the full
        // cache from memory consuption reasons. That will need more thoughts
        // how to tackle this problem to keep the trashed property just fine.
        if (!link.encrypted.trashed) {
            const parentLinkTrashed = getParentTrashed(state, shareId, parentLinkId);
            let trashedProps;
            if (parentLinkTrashed) {
                trashedProps = {
                    trashed: parentLinkTrashed,
                    trashedByParent: true,
                };
            } else if (original?.encrypted.trashedByParent) {
                // If the link do not belong under trashed tree anymore, and
                // the link is trashed by parent, we can reset it back.
                trashedProps = {
                    trashed: null,
                    trashedByParent: false,
                };
            }
            if (trashedProps) {
                link = {
                    encrypted: { ...link.encrypted, ...trashedProps },
                    decrypted: link.decrypted ? { ...link.decrypted, ...trashedProps } : undefined,
                };
            }
        }

        if (original) {
            const originalParentId = original.encrypted.parentLinkId;
            if (originalParentId !== parentLinkId) {
                const originalParentChildren = state[shareId].tree[originalParentId];
                if (originalParentChildren) {
                    state[shareId].tree[originalParentId] = originalParentChildren.filter(
                        (childLinkId) => childLinkId !== linkId
                    );
                }
            }

            const newSignatureIssues = getNewSignatureIssues(original.encrypted, link);

            original.decrypted = getNewDecryptedLink(original, link);
            original.encrypted = link.encrypted;

            original.encrypted.signatureIssues = newSignatureIssues;
            if (original.decrypted) {
                original.decrypted.signatureIssues = newSignatureIssues;
            }
        } else {
            state[shareId].links[linkId] = link;
        }

        // Only root link has no parent ID.
        if (parentLinkId) {
            const parentChildIds = state[shareId].tree[parentLinkId];
            if (parentChildIds) {
                // If the parent is trashed, we keep the tree structure, so we
                // can update properly trashed flag for all children after
                // parent is restored.
                if (link.encrypted.trashedByParent) {
                    if (!parentChildIds.includes(linkId)) {
                        state[shareId].tree[parentLinkId] = [...parentChildIds, linkId];
                    }
                } else if (link.encrypted.trashed) {
                    state[shareId].tree[parentLinkId] = parentChildIds.filter((childId) => childId !== linkId);
                    recursivelyTrashChildren(state, shareId, linkId, link.encrypted.trashed);
                } else {
                    if (!parentChildIds.includes(linkId)) {
                        state[shareId].tree[parentLinkId] = [...parentChildIds, linkId];
                    }
                    if (originalTrashed) {
                        recursivelyRestoreChildren(state, shareId, linkId, originalTrashed);
                    }
                }
            } else {
                state[shareId].tree[parentLinkId] = [linkId];
            }
        }
    });

    return { ...state };
}

/**
 * getParentTrashed finds closest parent which is trashed and returns its
 * trashed property, or returns null if link is not belonging under trashed
 * folder.
 */
function getParentTrashed(state: LinksState, shareId: string, linkId: string): number | null {
    while (linkId) {
        const link = state[shareId].links[linkId];
        if (!link) {
            return null;
        }
        if (link.encrypted.trashed) {
            return link.encrypted.trashed;
        }
        linkId = link.encrypted.parentLinkId;
    }
    return null;
}

/**
 * recursivelyTrashChildren sets trashed flag to all children of the parent.
 * When parent is trashed, API do not create event for every child, therefore
 * we need to update trashed flag the same way for all of them in our cache.
 */
function recursivelyTrashChildren(state: LinksState, shareId: string, linkId: string, trashed: number) {
    recursivelyUpdateLinks(state, shareId, linkId, (link) => {
        return {
            encrypted: {
                ...link.encrypted,
                trashed: link.encrypted.trashed || trashed,
                trashedByParent: true,
            },
            decrypted: link.decrypted
                ? {
                      ...link.decrypted,
                      trashed: link.decrypted.trashed || trashed,
                      trashedByParent: true,
                  }
                : undefined,
        };
    });
}

/**
 * recursivelyRestoreChildren unsets trashed flag to children of the parent.
 * It's similar to trashing: API do not create event for the childs, therefore
 * we need to remove trashed flag from children but only the ones which have
 * the same value because if the child was trashed first and then parent, user
 * will restore only parent and the previosly trashed child still needs to stay
 * in trash.
 */
function recursivelyRestoreChildren(state: LinksState, shareId: string, linkId: string, originalTrashed: number) {
    recursivelyUpdateLinks(state, shareId, linkId, (link) => {
        if (link.encrypted.trashed !== originalTrashed) {
            return link;
        }
        return {
            encrypted: {
                ...link.encrypted,
                trashed: null,
                trashedByParent: false,
            },
            decrypted: link.decrypted
                ? {
                      ...link.decrypted,
                      trashed: null,
                      trashedByParent: false,
                  }
                : undefined,
        };
    });
}

/**
 * recursivelyUpdateLinks recursively calls updateCallback for every cached
 * child of the provided linkId in scope of shareId.
 */
function recursivelyUpdateLinks(
    state: LinksState,
    shareId: string,
    linkId: string,
    updateCallback: (link: Link) => Link
) {
    state[shareId].tree[linkId]?.forEach((linkId) => {
        const child = state[shareId].links[linkId];
        if (!child) {
            return;
        }
        state[shareId].links[linkId] = updateCallback(child);
        recursivelyUpdateLinks(state, shareId, child.encrypted.linkId, updateCallback);
    });
}

function getNewSignatureIssues(original: EncryptedLink, newLink: Link): SignatureIssues | undefined {
    const newSignatureIssues = newLink.decrypted?.signatureIssues || newLink.encrypted.signatureIssues;
    const isSame = isEncryptedLinkSame(original, newLink.encrypted);
    // If the link is different (different keys or new version of encrypted
    // values), we need to forget all previous signature issues and try decrypt
    // them again, or accept new issues if it was already tried.
    if (!isSame) {
        return newSignatureIssues;
    }
    if (original.signatureIssues || newSignatureIssues) {
        return { ...original.signatureIssues, ...newSignatureIssues };
    }
    return undefined;
}

/**
 * getNewDecryptedLink returns new version of decrypted link. It tries to
 * preserve the locally cached data, such as share URL num accesses.
 * If the `newLink` has decrypted version, it is used directly and enhanced
 * with `getDecryptedLinkComputedData`.
 * If the `original` link has decrypted version, the new decrypted link
 * is combination of `newLink` encrypted version, `original` decrypted
 * values (such as name or fileModifyTime), and locally computed data.
 * If the case the new decrypted link doesn't match with previous encrypted
 * data and needs re-decryption, `isStale` is set for later decryption.
 * Decryption is not done right away, because the link might not be needed;
 * any view which needs data needs to make sure to run code to re-decrypt
 * stale links. The link is not cleared to not cause blinks in the UI.
 */
function getNewDecryptedLink(original: Link, newLink: Link): DecryptedLink | undefined {
    if (newLink.decrypted) {
        return {
            ...newLink.decrypted,
            ...getDecryptedLinkComputedData(original.decrypted, newLink.decrypted.shareUrl),
        };
    }
    if (original.decrypted) {
        return {
            ...newLink.encrypted,
            encryptedName: original.decrypted.encryptedName,
            name: original.decrypted.name,
            fileModifyTime: original.decrypted.fileModifyTime,
            duration: original.decrypted.duration,
            corruptedLink: original.decrypted.corruptedLink,
            isAnonymous: original.decrypted.isAnonymous,
            sharedOn: original.decrypted.sharedOn,
            sharedBy: original.decrypted.sharedBy,
            ...getDecryptedLinkComputedData(original.decrypted, newLink.encrypted.shareUrl),
            isStale: !isDecryptedLinkSame(original.encrypted, newLink.encrypted),
        };
    }
    return undefined;
}

/**
 * getDecryptedLinkComputedData returns locally computed data:
 * numAccesses from shareUrl.
 */
function getDecryptedLinkComputedData(link?: DecryptedLink, newShareUrl?: LinkShareUrl) {
    return !link
        ? {}
        : {
              shareUrl: newShareUrl
                  ? {
                        ...newShareUrl,
                        numAccesses: getNewNumAccesses(newShareUrl, link),
                    }
                  : undefined,
          };
}

function getNewNumAccesses(newShareUrl: LinkShareUrl, oldLink?: DecryptedLink): number | undefined {
    // Prefer the one coming from the new share URL info if set.
    if (newShareUrl.numAccesses !== undefined) {
        return newShareUrl.numAccesses;
    }
    // If not set, but we have it cached from before, use that.
    // This information is not part of every response.
    if (oldLink?.shareUrl?.numAccesses !== undefined) {
        return oldLink.shareUrl.numAccesses;
    }
    // If there is no old share URL, but there is incoming one, that
    // means it is freshly created share URL. In other words, it was
    // not shared yet. We can safely set zero in such case so we don't
    // have to do extra request to get zero.
    if (oldLink && !oldLink.shareUrl) {
        return 0;
    }
    // In all other cases keep undefined. We just don't know.
    return undefined;
}

const LinksStateContext = createContext<ReturnType<typeof useLinksStateProvider> | null>(null);

export function LinksStateProvider({ children }: { children: React.ReactNode }) {
    const value = useLinksStateProvider();
    return <LinksStateContext.Provider value={value}>{children}</LinksStateContext.Provider>;
}

export default function useLinksState() {
    const state = useContext(LinksStateContext);
    if (!state) {
        throw new Error('Trying to use uninitialized LinksStateProvider');
    }
    return state;
}
