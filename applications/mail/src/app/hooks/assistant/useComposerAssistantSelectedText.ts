import { RefObject, useEffect, useState } from 'react';

interface Props {
    assistantResultRef: RefObject<HTMLDivElement>;
    canCheckSelection: boolean;
    inputSelectedText?: string;
}
const useComposerAssistantSelectedText = ({ assistantResultRef, canCheckSelection, inputSelectedText }: Props) => {
    // Selected text in the composer or assistant result that the user might want to refine
    const [selectedText, setSelectedText] = useState(inputSelectedText);

    const handleSelectionChange = () => {
        const selection = document.getSelection();
        if (selection && assistantResultRef.current) {
            // Selection can start before or end after the div containing the result
            // We want to make sure the full selected text is inside the result container
            const selectionInAssistant =
                assistantResultRef.current.contains(selection.anchorNode) &&
                assistantResultRef.current.contains(selection.focusNode);
            if (selectionInAssistant) {
                setSelectedText(selection.toString());
                // setDisplayRefinePopover(true); TODO enable this later
                return;
            }
        }
        setSelectedText('');
    };

    useEffect(() => {
        let hasListener = false;
        if (canCheckSelection) {
            document.addEventListener('selectionchange', handleSelectionChange);
            hasListener = true;
        }
        return () => {
            if (hasListener) {
                document.removeEventListener('selectionchange', handleSelectionChange);
            }
        };
    }, [canCheckSelection]);

    return { selectedText, setSelectedText };
};

export default useComposerAssistantSelectedText;
