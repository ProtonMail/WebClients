import {
    $createLineBreakNode,
    $createParagraphNode,
    $createTextNode,
    $getRoot,
    $isElementNode,
    $isLineBreakNode,
} from 'lexical';

import { getMentionToken, splitMessageIntoMentionSegments } from '@proton/meet/utils/mentions/mentionToken';

import { $createMentionNode, $isMentionNode } from '../../components/MentionInput/MentionNode';
import type { MentionLabel } from './mentionLabel';

export const $readMentionValue = () =>
    $getRoot()
        .getChildren()
        .map((child) => {
            if (!$isElementNode(child)) {
                return child.getTextContent();
            }

            return child
                .getChildren()
                .map((node) => {
                    if ($isMentionNode(node)) {
                        return getMentionToken(node.getMentionId());
                    }

                    return $isLineBreakNode(node) ? '\n' : node.getTextContent();
                })
                .join('');
        })
        .join('\n');

export const $writeMentionValue = (value: string, getMentionLabel: (id: string) => MentionLabel) => {
    const root = $getRoot();

    root.clear();

    const paragraph = $createParagraphNode();

    for (const segment of splitMessageIntoMentionSegments(value)) {
        if (segment.type === 'mention') {
            const { name, className } = getMentionLabel(segment.id);

            paragraph.append($createMentionNode(segment.id, `@${name}`, className));
            continue;
        }

        segment.text.split('\n').forEach((line, index) => {
            if (index > 0) {
                paragraph.append($createLineBreakNode());
            }

            if (line.length > 0) {
                paragraph.append($createTextNode(line));
            }
        });
    }

    root.append(paragraph);

    return paragraph;
};
