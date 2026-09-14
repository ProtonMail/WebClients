import { useEffect, useRef } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, HISTORY_MERGE_TAG } from 'lexical';

import { useMentionLabels } from '../../../hooks/useMentionLabels';
import { $isMentionNode } from '../MentionNode';

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

        editor.update(
            () => {
                for (const node of $getRoot().getAllTextNodes()) {
                    if (!$isMentionNode(node)) {
                        continue;
                    }

                    const { name, className } = getMentionLabel(node.getMentionId());
                    const text = `@${name}`;

                    if (node.getTextContent() !== text) {
                        node.setTextContent(text);
                    }

                    if (node.__mentionClassName !== className) {
                        node.getWritable().__mentionClassName = className;
                    }
                }
            },
            { tag: HISTORY_MERGE_TAG }
        );
    }, [editor, getMentionLabel]);

    return null;
};
