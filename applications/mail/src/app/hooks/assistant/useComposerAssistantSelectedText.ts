import { RefObject, useEffect, useRef, useState } from 'react';

interface Props {
    assistantResultRef: RefObject<HTMLDivElement>;
    inputSelectedText?: string;
}
const useComposerAssistantSelectedText = ({ assistantResultRef, inputSelectedText }: Props) => {
    // Selected text in the composer or assistant result that the user might want to refine
    const [selectedText, setSelectedText] = useState(inputSelectedText);

    const [displayRefinePopover, setDisplayRefinePopover] = useState<boolean>(false);

    const mouseDownRef = useRef(false);

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
                return;
            }
        }
        setSelectedText('');
    };

    const handleMouseDown = () => {
        mouseDownRef.current = true;
    };

    // Listen mouse up at document lvl to handle the case when the user clicks
    // outside the assistant
    useEffect(() => {
        const handleMouseUp = () => {
            if (mouseDownRef.current) {
                mouseDownRef.current = false;
                handleSelectionChange();
            }
        };
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Controls the popover display
    useEffect(() => {
        if (selectedText && !displayRefinePopover) {
            setDisplayRefinePopover(true);
        } else if (!selectedText) {
            setDisplayRefinePopover(false);
        }
    }, [selectedText, displayRefinePopover]);

    // Update selected text when selection in editor is changing,
    // and hide the refine popover when the user deselect content in the editor.
    useEffect(() => {
        setSelectedText(inputSelectedText);
        if (inputSelectedText) {
            setDisplayRefinePopover(true);
        }
    }, [inputSelectedText]);

    const handleCloseRefinePopover = () => {
        setSelectedText('');
        setDisplayRefinePopover(false);
    };

    return {
        selectedText,
        setSelectedText,
        handleMouseDown,
        handleCloseRefinePopover,
        handleSelectionChange,
        displayRefinePopover,
    };
};

export default useComposerAssistantSelectedText;
