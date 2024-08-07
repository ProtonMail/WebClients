import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useComposerAssistantProvider } from 'proton-mail/components/assistant/provider/ComposerAssistantProvider';

interface Props {
    assistantResultRef: RefObject<HTMLDivElement>;
    composerSelectedText?: string;
    onResetRequest?: () => void;
    assistantID: string;
}
const useComposerAssistantSelectedText = ({
    assistantID,
    assistantResultRef,
    composerSelectedText,
    onResetRequest,
}: Props) => {
    // Selected text in the composer or assistant result that the user might want to refine
    const [selectedText, setSelectedText] = useState(composerSelectedText);
    const prevSelectionRef = useRef<string>('');
    const composerSelectionRef = useRef<string>(composerSelectedText || '');

    const { assistantRefManager } = useComposerAssistantProvider();

    const mouseDownRef = useRef(false);

    const handleSelectionChange = () => {
        setTimeout(() => {
            const selection = document.getSelection();
            if (selection && assistantResultRef.current) {
                // Selection can start before or end after the div containing the result
                // We want to make sure the full selected text is inside the result container
                const selectionInAssistant =
                    assistantResultRef.current.contains(selection.anchorNode) &&
                    assistantResultRef.current.contains(selection.focusNode);
                const selectionText = selection.toString().trim();

                if (selectionInAssistant && prevSelectionRef.current !== selectionText) {
                    setSelectedText(selectionText);
                    onResetRequest?.();
                    return;
                }
            }
            // Use the composer selection (if any) as selected text when we want to reset the selection
            // The user might cancel and re-generate using the previous composer selection
            const composerSelection = composerSelectionRef.current;
            setSelectedText(composerSelection ? composerSelection : '');
        }, 0);
    };

    const handleMouseDown = () => {
        mouseDownRef.current = true;
    };

    // Listen mouse up at document lvl to handle the case when the user clicks
    // outside the assistant
    useEffect(() => {
        const handleMouseUp = (e: any) => {
            const inputContainerElement = assistantRefManager.container.get(assistantID);

            if (mouseDownRef.current) {
                mouseDownRef.current = false;
                // Do not reset the selection if user clicks in the input container
                if (inputContainerElement.current?.contains(e.target)) {
                    return;
                }
                handleSelectionChange();
            }
        };
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Update selected text when selection in editor is changing,
    // and hide the refine popover when the user deselect content in the editor.
    useEffect(() => {
        setSelectedText(composerSelectedText);
        composerSelectionRef.current = composerSelectedText || '';
    }, [composerSelectedText]);

    return {
        selectedText,
        setSelectedText,
        handleMouseDown,
        handleSelectionChange,
    };
};

export default useComposerAssistantSelectedText;
