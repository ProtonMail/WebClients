import { EditorContent } from '@tiptap/react';
import { c } from 'ttag';
import { useState, useEffect, useRef, useMemo } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon } from '@proton/components';
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import FileIcon from '@proton/components/components/fileIcon/FileIcon';
import lumoStart from '@proton/styles/assets/img/illustrations/lumo-arrow.svg';
import lumoStop from '@proton/styles/assets/img/illustrations/lumo-stop.svg';

import { getMimeTypeFromExtension } from '../../../util/filetypes';

import { useFileMentionAutocomplete, type DriveSDKFunctions } from './hooks/useFileMentionAutocomplete';
import type { SpaceId, Message } from '../../../types';
import type { DriveNode } from '../../../hooks/useDriveSDK';

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
}: ComposerEditorAreaProps) => {
    // Create driveSDK object only if both functions are provided
    const driveSDK: DriveSDKFunctions | undefined = useMemo(() => {
        if (browseFolderChildren && downloadFile) {
            return {
                browseFolderChildren: async (folderId?: string) => {
                    const nodes = await browseFolderChildren(folderId);
                    return nodes.map(node => ({
                        id: node.nodeId,
                        name: node.name,
                        type: node.type,
                    }));
                },
                downloadFile,
            };
        }
        return undefined;
    }, [browseFolderChildren, downloadFile]);

    const { mentionState, files, selectFile, closeMention } = useFileMentionAutocomplete(editor, spaceId, messageChain, driveSDK);
    
    const [selectedIndex, setSelectedIndex] = useState(0);
    
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
                        selectFile(fileToSelect);
                    }
                } else if (!e.shiftKey) {
                    // No files to select, close mention and submit (desktop behavior)
                    e.preventDefault();
                    e.stopPropagation();
                    closeMention();
                    onSubmit();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeMention();
            }
        };

        editorElement.addEventListener('keydown', handleKeyDown, true);
        return () => editorElement.removeEventListener('keydown', handleKeyDown, true);
    }, [editor, mentionState.isActive, files, selectedIndex, selectFile, closeMention, onSubmit]);

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

            {/* File mention autocomplete dropdown */}
            {mentionState.isActive && mentionState.position && files.length > 0 && (
                <div
                    className="file-mention-autocomplete fixed bg-norm border border-weak rounded-lg shadow-lifted z-[60] max-h-80 overflow-y-auto min-w-72 py-1"
                    style={{
                        top: `${mentionState.position.top}px`,
                        left: `${mentionState.position.left}px`,
                        maxWidth: `min(calc(100vw - ${mentionState.position.left + 16}px), 24rem)`,
                    }}
                >
                    {files.map((file, index) => {
                        const mimeType = file.mimeType || (file.source === 'drive' ? getMimeTypeFromExtension(file.name) : undefined);
                        const query = mentionState.query.toLowerCase();
                        const fullPath = file.name;
                        
                        // Split path into folder and filename for better display
                        const lastSlashIndex = fullPath.lastIndexOf('/');
                        const folderPath = lastSlashIndex > 0 ? fullPath.substring(0, lastSlashIndex) : '';
                        const fileName = lastSlashIndex > 0 ? fullPath.substring(lastSlashIndex + 1) : fullPath;
                        
                        // Highlight matching text
                        const highlightText = (text: string, query: string): { text: string; isMatch: boolean }[] => {
                            if (!query) {
                                return [{ text, isMatch: false }];
                            }
                            
                            const parts: { text: string; isMatch: boolean }[] = [];
                            let lastIndex = 0;
                            let searchIndex = 0;
                            
                            while (true) {
                                const matchIndex = text.toLowerCase().indexOf(query, searchIndex);
                                if (matchIndex === -1) {
                                    // Add remaining text
                                    if (lastIndex < text.length) {
                                        parts.push({ text: text.slice(lastIndex), isMatch: false });
                                    }
                                    break;
                                }
                                
                                // Add text before match
                                if (matchIndex > lastIndex) {
                                    parts.push({ text: text.slice(lastIndex, matchIndex), isMatch: false });
                                }
                                
                                // Add matched text
                                parts.push({ text: text.slice(matchIndex, matchIndex + query.length), isMatch: true });
                                
                                lastIndex = matchIndex + query.length;
                                searchIndex = matchIndex + 1;
                            }
                            
                            return parts.length > 0 ? parts : [{ text, isMatch: false }];
                        };
                        
                        const highlightedFileNameParts = highlightText(fileName, query);
                        const highlightedFolderParts = folderPath ? highlightText(folderPath, query) : [];
                        
                        return (
                            <button
                                key={`${file.source}-${file.id}`}
                                type="button"
                                className={`w-full text-left px-4 py-3 hover:bg-weak transition-colors flex items-center gap-3 ${
                                    index === selectedIndex ? 'bg-weak' : ''
                                }`}
                                onClick={() => selectFile(file)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                {mimeType ? (
                                    <FileIcon mimeType={mimeType} className="flex-shrink-0" size={3.5} />
                                ) : (
                                    <Icon name="file-lines" size={3.5} className="color-weak flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    {folderPath && (
                                        <div className="text-xs color-weak truncate mb-0.5">
                                            {highlightedFolderParts.map((part, partIndex) => (
                                                <span
                                                    key={partIndex}
                                                    className={part.isMatch ? 'font-medium color-primary' : ''}
                                                >
                                                    {part.text}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="text-sm truncate">
                                        {highlightedFileNameParts.map((part, partIndex) => (
                                            <span
                                                key={partIndex}
                                                className={part.isMatch ? 'font-semibold color-primary' : ''}
                                            >
                                                {part.text}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {file.source === 'drive' && (
                                    <IcBrandProtonDrive size={3} className="color-primary flex-shrink-0 opacity-70" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

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
