import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, RootNode } from 'lexical';

import { $getStoredLength, $trimStoredContent } from '../../../utils/mentions/mentionLength';

/** Caps length on the trimmed stored form (see `mentionLength`). */
export const MaxLengthPlugin = ({ maxLength }: { maxLength: number }) => {
    const [editor] = useLexicalComposerContext();

    useEffect(
        () =>
            editor.registerNodeTransform(RootNode, () => {
                const excess = $getStoredLength() - maxLength;

                if (excess <= 0) {
                    return;
                }

                const selection = $getSelection();
                // No selection — trim from the end.
                const anchor = $isRangeSelection(selection) && selection.isCollapsed() ? selection.anchor : null;

                $trimStoredContent(excess, anchor);
            }),
        [editor, maxLength]
    );

    return null;
};
