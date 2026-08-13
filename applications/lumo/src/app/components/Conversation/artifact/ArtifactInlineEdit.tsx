import { type RefObject, useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowUp } from '@proton/icons/icons/IcArrowUp';

import { useConversationActions } from '../../../providers/ConversationActionsProvider';
import { useWebSearch } from '../../../providers/WebSearchProvider';
import type { ArtifactActionMeta } from '../../../types';
import { ARTIFACT_TYPE_CONFIG } from './artifactTypeConfig';
import type { ArtifactType } from './parseArtifacts';
import { useArtifactSelection } from './useArtifactSelection';

interface ArtifactInlineEditProps {
    containerRef: RefObject<HTMLDivElement>;
    artifactId: string;
    title: string;
    artifactType: ArtifactType;
    isGenerating: boolean;
}

export const ArtifactInlineEdit = ({
    containerRef,
    artifactId,
    title,
    artifactType,
    isGenerating,
}: ArtifactInlineEditProps) => {
    const { handleSendArtifactAction } = useConversationActions();
    const { isWebSearchButtonToggled } = useWebSearch();
    const inlineEditMode = ARTIFACT_TYPE_CONFIG[artifactType].inlineEditMode;
    const { selection, clearSelection } = useArtifactSelection(containerRef);
    const [editPrompt, setEditPrompt] = useState('');
    const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Reset prompt when selection changes
    useEffect(() => {
        setEditPrompt('');
    }, [selection?.text]);

    // Focus the inline input when a new selection appears (freeform artifacts only)
    useEffect(() => {
        if (selection && !isGenerating && inlineEditMode === 'freeform') {
            inputRef.current?.focus();
        }
    }, [selection, isGenerating, inlineEditMode]);

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

    // Selection-based inline edit isn't viable for content rendered inside a sandboxed,
    // cross-origin iframe (webpage) — the panel can't read a text selection out of it the way
    // it can for DOM-rendered code/document content. Follow-ups go through the normal composer.
    if (inlineEditMode === 'none' || !selection || !containerRect || isGenerating) {
        return null;
    }

    const sendArtifactAction = (meta: ArtifactActionMeta) => {
        void handleSendArtifactAction(meta, isWebSearchButtonToggled);
        clearSelection();
    };

    const handleSubmit = () => {
        const trimmed = editPrompt.trim();
        if (!trimmed) {
            return;
        }

        sendArtifactAction({
            kind: 'edit',
            artifactId,
            artifactTitle: title,
            artifactType,
            selection: selection.text,
            userInstruction: trimmed,
        });
    };

    const handleExplain = () => {
        sendArtifactAction({
            kind: 'explain',
            artifactId,
            artifactTitle: title,
            artifactType,
            selection: selection.text,
        });
    };

    const handleImprove = () => {
        sendArtifactAction({
            kind: 'improve',
            artifactId,
            artifactTitle: title,
            artifactType,
            selection: selection.text,
        });
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
            {inlineEditMode === 'selection' ? (
                <div className="flex flex-row items-center gap-2 p-1">
                    <Button size="small" shape="outline" color="weak" onClick={handleExplain}>
                        {c('collider_2025:Action').t`Explain`}
                    </Button>
                    <Button size="small" shape="outline" color="weak" onClick={handleImprove}>
                        {c('collider_2025:Action').t`Improve`}
                    </Button>
                </div>
            ) : (
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
                        className="artifact-inline-edit-input flex-1 text-sm color-norm bg-transparent border-none outline-none--at-all resize-none p-2"
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
            )}
        </div>
    );
};

export default ArtifactInlineEdit;
