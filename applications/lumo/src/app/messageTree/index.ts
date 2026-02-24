import type {MessageMap} from '../redux/slices/core/messages';
import type {Message, MessageId} from '../types';

type MessageNode = {
    id: MessageId;
    parent: MessageNode | null;
    children: MessageNode[];
    date: Date;
};

type MessageTree = {
    rootNode: MessageNode | undefined;
    nodeMap: Record<MessageId, MessageNode>;
};

function findMostRecent(rootNode: MessageNode, bestSoFar?: MessageNode): MessageNode {
    let newBest = undefined;
    for (const c of rootNode.children) {
        const candidate = findMostRecent(c, bestSoFar);
        if (!newBest || candidate.date > newBest.date) {
            newBest = candidate;
        }
    }
    return newBest ?? bestSoFar ?? rootNode;
}

function findMostRecentMessage(
    nodeMap: Record<string, MessageNode>,
    deepestQueriedNode: MessageId,
    messageMap: MessageMap
): Message {
    const subTreeRootNode = nodeMap[deepestQueriedNode];
    console.assert(subTreeRootNode !== undefined);
    const mostRecentNode = findMostRecent(subTreeRootNode);
    const mostRecentId = mostRecentNode.id;
    return messageMap[mostRecentId];
}

function hasAncestor(maybeDescendant: MessageId, maybeAncestor: MessageId, messageMap: MessageMap): boolean {
    let message = messageMap[maybeDescendant];
    while (true) {
        const parentId = message.parentId;
        if (parentId === maybeAncestor) {
            return true;
        }
        if (parentId === undefined) {
            return false;
        }
        message = messageMap[parentId];
    }
}

function findDeepestQueriedNode(preferredSiblings: MessageId[], messageMap: MessageMap): MessageId | null {
    let deepestQueriedNode: MessageId | null = null;
    for (const q of preferredSiblings) {
        if (messageMap[q] === undefined) {
            continue;
        }
        if (deepestQueriedNode === null) {
            deepestQueriedNode = q;
            continue;
        }
        if (hasAncestor(q, deepestQueriedNode, messageMap)) {
            deepestQueriedNode = q;
        }
    }
    return deepestQueriedNode;
}

function buildTree(messageMap: MessageMap): MessageTree {
    const nodeMap: Record<MessageId, MessageNode> = Object.fromEntries(
        Object.values(messageMap).map((m) => [
            /* key: */ m.id,
            /* node: */ {
                id: m.id,
                parent: null,
                children: [],
                date: new Date(m.createdAt),
            },
        ])
    );
    let rootNode: MessageNode | undefined = undefined;
    for (const message of Object.values(messageMap)) {
        const childNode = nodeMap[message.id];
        if (message.parentId) {
            const parentNode = nodeMap[message.parentId];
            if (!parentNode) {
                // tree is malformed: should not happen, but in case it does, fail gracefully
                continue;
            }
            childNode.parent = parentNode;
            parentNode.children.push(childNode);
        } else {
            rootNode = childNode;
        }
    }
    return { rootNode, nodeMap };
}

function walkBackFromLeaf(messageMap: MessageMap, messageId: MessageId | undefined): Message[] {
    // Find the current message, add it to the chain and append to the parent chain (recurse)
    if (messageId === undefined) {
        return [];
    }
    const message = messageMap[messageId];
    if (!message) {
        return [];
    }
    const upperChain = message.parentId ? walkBackFromLeaf(messageMap, message.parentId) : [];
    return [...upperChain, message];
}

function findLeaf(messageMap: MessageMap, preferredSiblings: MessageId[]): Message | undefined {
    const { rootNode, nodeMap } = buildTree(messageMap);
    if (rootNode === undefined) {
        return undefined;
    }
    const deepestQueriedNode = findDeepestQueriedNode(preferredSiblings, messageMap) || rootNode.id;
    return findMostRecentMessage(nodeMap, deepestQueriedNode, messageMap);
}

export function buildLinearChain(
    messageMap: MessageMap,
    messageId: MessageId | undefined | null,
    preferredSiblings: MessageId[]
): Message[] {
    // messageId:
    //   - undefined means no message (like the void root message)
    //   - null means "figure out the best leaf"
    // preferredSiblings:
    //   Keeps track of which sibling messages have been manually
    //   selected with the "<" or ">" buttons.
    //   It is an array of messages ids, in order of preference, that should be
    //   included in the linear chain (and thus displayed on-screen), if possible.

    if (messageId === null) {
        messageId = findLeaf(messageMap, preferredSiblings)?.id;
    }

    return walkBackFromLeaf(messageMap, messageId);
}
