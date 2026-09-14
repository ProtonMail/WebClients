import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_LOW, KEY_ENTER_COMMAND } from 'lexical';

/** Enter submits; LOW priority so the mention list can claim Enter first. */
export const SubmitOnEnterPlugin = ({ onSubmit }: { onSubmit: () => void }) => {
    const [editor] = useLexicalComposerContext();

    useEffect(
        () =>
            editor.registerCommand(
                KEY_ENTER_COMMAND,
                (event) => {
                    if (event?.shiftKey) {
                        return false;
                    }

                    event?.preventDefault();
                    onSubmit();

                    return true;
                },
                COMMAND_PRIORITY_LOW
            ),
        [editor, onSubmit]
    );

    return null;
};
