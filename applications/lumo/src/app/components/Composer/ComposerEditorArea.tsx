import { EditorContent } from '@tiptap/react';
import { c } from 'ttag';
import { useState, useEffect, useRef, useMemo } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import lumoStart from '@proton/styles/assets/img/illustrations/lumo-arrow.svg';
import lumoStop from '@proton/styles/assets/img/illustrations/lumo-stop.svg';

import { useFileMentionAutocomplete, type DriveSDKFunctions } from './hooks/useFileMentionAutocomplete';
import type { SpaceId, Message } from '../../types';
import type { DriveNode } from '../../hooks/useDriveSDK';
import { FileMentionComponent } from './FileMentionComponent';

export interface ComposerEditorAreaProps {
    editor: any; // TipTap editor instance
    canShowSendButton: boolean;
    sendIsDisabled: boolean;
    isGenerating: boolean;
    isProcessingAttachment: boolean;
    onAbort?: () => void;
    onSubmit: () => void;
    spaceId?: SpaceId;
    messageChain?: Message[];
    isAutocompleteActiveRef?: React.MutableRefObject<boolean>;
    // Optional Drive SDK functions - only provided for authenticated users
    browseFolderChildren?: (folderId?: string) => Promise<DriveNode[]>;
    downloadFile?: (nodeId: string) => Promise<ArrayBuffer>;
    // Optional user ID - only provided for authenticated users
    userId?: string;
}

export const ComposerEditorArea = ({
    editor,
    canShowSendButton,
    sendIsDisabled,
    isGenerating,
    isProcessingAttachment,
    onAbort,
    onSubmit,
    spaceId,
    messageChain = [],
    isAutocompleteActiveRef,
    browseFolderChildren,
    downloadFile,
    userId,
}: ComposerEditorAreaProps) => {
    // Create driveSDK object only if both functions are provided
    const driveSDK: DriveSDKFunctions | undefined = useMemo(() => {
        if (browseFolderChildren && downloadFile) {
            return {
                browseFolderChildren: async (folderId?: string) => {
                    const nodes = await browseFolderChildren(folderId);
                    return nodes.map(node => ({
                        id: node.nodeUid,
                        name: node.name,
                        type: node.type,
                    }));
                },
                downloadFile,
            };
        }
        return undefined;
    }, [browseFolderChildren, downloadFile]);

    const { mentionState, files, selectFile, closeMention } = useFileMentionAutocomplete(editor, spaceId, messageChain, driveSDK, undefined, userId);

    const [selectedIndex, setSelectedIndex] = useState(0);

    // Stable refs for callbacks to avoid reattaching listeners unnecessarily
    const selectFileRef = useRef(selectFile);
    const closeMentionRef = useRef(closeMention);
    const onSubmitRef = useRef(onSubmit);

    useEffect(() => {
        selectFileRef.current = selectFile;
    }, [selectFile]);

    useEffect(() => {
        closeMentionRef.current = closeMention;
    }, [closeMention]);

    useEffect(() => {
        onSubmitRef.current = onSubmit;
    }, [onSubmit]);

    // Track previous isActive to detect when autocomplete opens
    const prevIsActiveRef = useRef(false);

    // Update the external ref and reset selectedIndex when autocomplete state changes
    useEffect(() => {
        if (isAutocompleteActiveRef) {
            isAutocompleteActiveRef.current = mentionState.isActive;
        }

        // Reset selected index only when autocomplete opens (transitions from false to true)
        if (mentionState.isActive && !prevIsActiveRef.current) {
            setSelectedIndex(0);
        }

        prevIsActiveRef.current = mentionState.isActive;
    }, [mentionState.isActive, isAutocompleteActiveRef]);

    // Keep selectedIndex in bounds when files change
    useEffect(() => {
        if (selectedIndex >= files.length && files.length > 0) {
            setSelectedIndex(files.length - 1);
        }
    }, [files.length, selectedIndex]);

    // Handle keyboard navigation for autocomplete
    useEffect(() => {
        if (!mentionState.isActive || !editor) {
            return;
        }

        const editorElement = editor.view.dom;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!mentionState.isActive) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) => (prev < files.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === 'Enter') {
                if (files.length > 0) {
                    // Select the file from autocomplete
                    e.preventDefault();
                    e.stopPropagation();
                    const fileToSelect = files[selectedIndex];
                    if (fileToSelect) {
                        selectFileRef.current?.(fileToSelect);
                    }
                } else if (!e.shiftKey) {
                    // No files to select, close mention and submit (desktop behavior)
                    e.preventDefault();
                    e.stopPropagation();
                    closeMentionRef.current?.();
                    onSubmitRef.current?.();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeMentionRef.current?.();
            }
        };

        editorElement.addEventListener('keydown', handleKeyDown, true);
        return () => editorElement.removeEventListener('keydown', handleKeyDown, true);
    // Only depend on the values that affect keyboard handling; avoid reattaching on array identity changes
    }, [editor, mentionState.isActive, files.length, selectedIndex]);

    return (
        <div
            className="lumo-input flex-grow w-full z-30 flex flex-row flex-nowrap items-center gap-3 p-2 pl-3 min-h-custom my-auto border border-weak bg-norm relative"
            style={{ '--min-h-custom': '3.5rem' /*56px*/ }}
        >
            {/* main text area where user types */}
            <EditorContent
                editor={editor}
                className="flex flex-row items-center w-full overflow-y-auto p-1 max-h-custom"
                style={{ '--max-h-custom': '13.125rem' /*210px*/ }}
            />

            <FileMentionComponent
                mentionState={mentionState}
                files={files}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
                selectFile={selectFile}
            />

            {canShowSendButton && (
                <div className="flex flex-row self-end items-end gap-1 h-full shrink-0 composer-submit-button">
                    {/* send button (becomes abort button during generation) */}
                    <Tooltip
                        title={
                            isProcessingAttachment
                                ? c('collider_2025: Info').t`Please wait for files to finish processing`
                                : isGenerating
                                  ? c('collider_2025: Action').t`Stop generating`
                                  : c('collider_2025: Action').t`Send message`
                        }
                    >
                        <Button
                            icon
                            className="rounded-full p-0 ratio-square border-0 w-custom"
                            size="small"
                            style={{ inlineSize: '2.25rem' /* 36px */ }}
                            disabled={sendIsDisabled}
                            onClick={isGenerating ? onAbort : onSubmit}
                            color="norm"
                        >
                            <img
                                src={isGenerating ? lumoStop : lumoStart}
                                alt={
                                    isGenerating
                                        ? c('collider_2025: Action').t`Stop generating`
                                        : c('collider_2025: Action').t`Start generating`
                                }
                            />
                        </Button>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};
