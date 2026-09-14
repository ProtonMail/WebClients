import type { LexicalNode, Point } from 'lexical';
import { $getRoot, $isElementNode, $isTextNode } from 'lexical';

import { getMentionToken } from '@proton/meet/utils/mentions/mentionToken';

import { $isMentionNode } from '../../components/MentionInput/MentionNode';
import { trimMessage } from '../trim-message';
import { $readMentionValue } from './mentionEditorState';

/** Length is measured on stored tokens (what gets sent), not display names. */
const $getStoredSize = (node: LexicalNode) =>
    $isMentionNode(node) ? getMentionToken(node.getMentionId()).length : node.getTextContent().length;

/** Trimmed, like the counter and the send-time check. Must be called inside `editor.read`/`editor.update`. */
export const $getStoredLength = () => trimMessage($readMentionValue()).length;

const $getLeaves = () =>
    $getRoot()
        .getChildren()
        .flatMap((child) => ($isElementNode(child) ? child.getChildren() : [child]));

const $deleteFrom = (nodes: LexicalNode[], remaining: number, anchor: Point | null) => {
    let left = remaining;

    for (const node of nodes) {
        if (left <= 0) {
            break;
        }

        // Mentions are removed whole, not sliced.
        if ($isMentionNode(node) || !$isTextNode(node)) {
            left -= $getStoredSize(node);
            node.remove();
            continue;
        }

        const text = node.getTextContent();
        const isAnchorNode = anchor?.key === node.getKey();
        const end = isAnchorNode ? Math.min(anchor.offset, text.length) : text.length;
        const take = Math.min(left, end);

        left -= take;

        const trimmed = text.slice(0, end - take) + text.slice(end);

        if (trimmed === '') {
            node.remove();
            continue;
        }

        node.setTextContent(trimmed);

        if (isAnchorNode) {
            node.select(end - take, end - take);
        }
    }

    return left;
};

/** Trims stored content to fit the limit. Must run inside `editor.update`. */
export const $trimStoredContent = (excess: number, anchor: Point | null) => {
    const leaves = $getLeaves();
    const anchorIndex = anchor ? leaves.findIndex((leaf) => leaf.getKey() === anchor.key) : -1;

    const order =
        anchorIndex === -1
            ? [...leaves].reverse()
            : [...leaves.slice(0, anchorIndex + 1).reverse(), ...leaves.slice(anchorIndex + 1).reverse()];

    // Delete text before mentions.
    const remaining = $deleteFrom(
        order.filter((node) => !$isMentionNode(node)),
        excess,
        anchor
    );

    if (remaining > 0) {
        $deleteFrom(order.filter($isMentionNode), remaining, anchor);
    }
};
