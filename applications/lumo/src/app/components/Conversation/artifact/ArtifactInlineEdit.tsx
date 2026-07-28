import { type RefObject, useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowUp } from '@proton/icons/icons/IcArrowUp';

import { useConversationActions } from '../../../providers/ConversationActionsProvider';
import { useWebSearch } from '../../../providers/WebSearchProvider';
import { useArtifactSelection } from './useArtifactSelection';

interface ArtifactInlineEditProps {
    containerRef: RefObject<HTMLDivElement>;
    artifactId: string;
    title: string;
    isGenerating: boolean;
}

export const ArtifactInlineEdit = ({ containerRef, artifactId, title, isGenerating }: ArtifactInlineEditProps) => {
    const { handleSendMessage } = useConversationActions();
    const { isWebSearchButtonToggled } = useWebSearch();
    const { selection, clearSelection } = useArtifactSelection(containerRef);
    const [editPrompt, setEditPrompt] = useState('');
    const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Reset prompt when selection changes
    useEffect(() => {
        setEditPrompt('');
    }, [selection?.text]);

    // Focus the inline input when a new selection appears
    useEffect(() => {
        if (selection && !isGenerating) {
            inputRef.current?.focus();
        }
    }, [selection, isGenerating]);

    // Track container width/position so the input spans the panel content area
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !selection) {
            setContainerRect(null);
            return;
        }

        const updateRect = () => {
            setContainerRect(container.getBoundingClientRect());
        };

        updateRect();
        window.addEventListener('resize', updateRect);
        return () => {
            window.removeEventListener('resize', updateRect);
        };
    }, [selection, containerRef]);

    // Dismiss on Escape or click outside
    useEffect(() => {
        if (!selection) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                clearSelection();
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (wrapperRef.current?.contains(e.target as Node)) {
                return;
            }
            clearSelection();
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, [selection, clearSelection]);

    if (!selection || !containerRect || isGenerating) {
        return null;
    }

    const handleSubmit = () => {
        const trimmed = editPrompt.trim();
        if (!trimmed) {
            return;
        }

        const prompt = c('collider_2025:Prefill')
            .t`Edit the "${title}" artifact (id: ${artifactId}). Replace this part:\n\n"${selection.text}"\n\nwith: ${trimmed}`;

        void handleSendMessage(prompt, isWebSearchButtonToggled);
        clearSelection();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const horizontalPadding = 16;
    const style: React.CSSProperties = {
        position: 'fixed',
        top: selection.anchorBottom + 8,
        left: containerRect.left + horizontalPadding,
        width: Math.max(containerRect.width - horizontalPadding * 2, 200),
    };

    return (
        <div ref={wrapperRef} className="artifact-inline-edit shadow-lifted rounded-lg p-2 bg-norm" style={style}>
            <div className="flex flex-row items-end gap-2">
                <TextareaAutosize
                    ref={inputRef}
                    value={editPrompt}
                    onChange={(e) => {
                        setEditPrompt(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    minRows={1}
                    maxRows={4}
                    placeholder={c('collider_2025:Placeholder').t`Describe what you would like to update...`}
                    className="artifact-inline-edit-input flex-1 text-sm color-norm bg-transparent border-none outline-none resize-none p-2"
                />
                <Button
                    icon
                    shape="solid"
                    color="norm"
                    size="small"
                    className="shrink-0 mb-1"
                    disabled={!editPrompt.trim()}
                    onClick={handleSubmit}
                    title={c('collider_2025:Action').t`Send`}
                >
                    <IcArrowUp size={4} />
                </Button>
            </div>
        </div>
    );
};

export default ArtifactInlineEdit;
