import { useEffect, useRef } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, HISTORY_MERGE_TAG } from 'lexical';

import { useMentionLabels } from '../../../hooks/useMentionLabels';
import type { MentionLabel } from '../../../utils/mentions/mentionLabel';
import { $isMentionNode } from '../MentionNode';

const $getOutdatedMentions = (getMentionLabel: (id: string) => MentionLabel) =>
    $getRoot()
        .getAllTextNodes()
        .filter($isMentionNode)
        .flatMap((node) => {
            const { name, className } = getMentionLabel(node.getMentionId());
            const text = `@${name}`;

            return node.getTextContent() === text && node.__mentionClassName === className
                ? []
                : [{ node, text, className }];
        });

/** Updates mention labels when participant names arrive asynchronously. */
export const MentionLabelSyncPlugin = () => {
    const [editor] = useLexicalComposerContext();
    const getMentionLabel = useMentionLabels();
    const isFirstRunRef = useRef(true);

    useEffect(() => {
        if (isFirstRunRef.current) {
            isFirstRunRef.current = false;
            return;
        }

        const hasOutdatedMentions = editor
            .getEditorState()
            .read(() => $getOutdatedMentions(getMentionLabel).length > 0);

        if (!hasOutdatedMentions) {
            return;
        }

        editor.update(
            () => {
                for (const { node, text, className } of $getOutdatedMentions(getMentionLabel)) {
                    node.setTextContent(text);
                    node.getWritable().__mentionClassName = className;
                }
            },
            { tag: HISTORY_MERGE_TAG }
        );
    }, [editor, getMentionLabel]);

    return null;
};
