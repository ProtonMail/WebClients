import { useState, useEffect, useRef, useMemo } from 'react';

import TextareaAutosize from 'react-textarea-autosize';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import lumoStart from '@proton/styles/assets/img/illustrations/lumo-arrow.svg';
import lumoStop from '@proton/styles/assets/img/illustrations/lumo-stop.svg';

import { useFileMentionAutocomplete, type DriveSDKFunctions } from './hooks/useFileMentionAutocomplete';
import type { SpaceId, Message } from '../../types';
import type { DriveNode } from '../../hooks/useDriveSDK';
import { FileMentionComponent } from './FileMentionComponent';
import type useComposerInput from '../../hooks/useComposerInput';

export interface ComposerEditorAreaProps {
    composerInput: ReturnType<typeof useComposerInput>;
    canShowSendButton: boolean;
    sendIsDisabled: boolean;
    isGenerating: boolean;
    isProcessingAttachment: boolean;
    onAbort?: () => void;
    onSubmit: () => void;
    spaceId?: SpaceId;
    messageChain?: Message[];
    isAutocompleteActiveRef?: React.MutableRefObject<boolean>;
    placeholder?: string;
    // Optional Drive SDK functions - only provided for authenticated users
    browseFolderChildren?: (folderId?: string) => Promise<DriveNode[]>;
    downloadFile?: (nodeId: string) => Promise<ArrayBuffer>;
    userId?: string;
}

export const ComposerEditorArea = ({
    composerInput,
    canShowSendButton,
    sendIsDisabled,
    isGenerating,
    isProcessingAttachment,
    onAbort,
    onSubmit,
    spaceId,
    messageChain = [],
    isAutocompleteActiveRef,
    placeholder,
    browseFolderChildren,
    downloadFile,
    userId,
}: ComposerEditorAreaProps) => {
    const { value, setValue, textareaRef, handleChange, handleKeyDown, handlePaste, updateCursorPosition, onFocus, onBlur } = composerInput;

    const driveSDK: DriveSDKFunctions | undefined = useMemo(() => {
        if (browseFolderChildren && downloadFile) {
            return {
                browseFolderChildren: async (folderId?: string) => {
                    const nodes = await browseFolderChildren(folderId);
                    return nodes.map((node) => ({
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

    const { mentionState, files, selectFile, closeMention } = useFileMentionAutocomplete(
        textareaRef,
        value,
        setValue,
        spaceId,
        driveSDK,
        undefined,
        userId
    );

    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectFileRef = useRef(selectFile);
    const closeMentionRef = useRef(closeMention);
    const onSubmitRef = useRef(onSubmit);

    useEffect(() => { selectFileRef.current = selectFile; }, [selectFile]);
    useEffect(() => { closeMentionRef.current = closeMention; }, [closeMention]);
    useEffect(() => { onSubmitRef.current = onSubmit; }, [onSubmit]);

    const prevIsActiveRef = useRef(false);
    useEffect(() => {
        if (isAutocompleteActiveRef) {
            isAutocompleteActiveRef.current = mentionState.isActive;
        }
        if (mentionState.isActive && !prevIsActiveRef.current) {
            setSelectedIndex(0);
        }
        prevIsActiveRef.current = mentionState.isActive;
    }, [mentionState.isActive, isAutocompleteActiveRef]);

    useEffect(() => {
        if (selectedIndex >= files.length && files.length > 0) {
            setSelectedIndex(files.length - 1);
        }
    }, [files.length, selectedIndex]);

    // Handle autocomplete keyboard navigation on top of the normal handleKeyDown
    const handleKeyDownWithAutocomplete = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (mentionState.isActive) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) => (prev < files.length - 1 ? prev + 1 : prev));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                return;
            }
            if (e.key === 'Enter') {
                if (files.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    const fileToSelect = files[selectedIndex];
                    if (fileToSelect) {
                        selectFileRef.current?.(fileToSelect);
                    }
                } else if (!e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    closeMentionRef.current?.();
                    onSubmitRef.current?.();
                }
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeMentionRef.current?.();
                return;
            }
        }
        // Fall through to normal key handling
        handleKeyDown(e);
        updateCursorPosition();
    };

    return (
        <div
            className="lumo-input flex-grow w-full z-30 flex flex-row flex-nowrap items-end gap-3 p-2 pl-3 my-auto bg-norm relative"
        >
            <TextareaAutosize
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDownWithAutocomplete}
                onPaste={handlePaste}
                onFocus={onFocus}
                onBlur={onBlur}
                onSelect={updateCursorPosition}
                onMouseUp={updateCursorPosition}
                placeholder={placeholder ?? c('collider_2025:Placeholder').t`Ask anything…`}
                className="tiptap ProseMirror composer flex-grow w-full resize-none p-1 bg-transparent border-0 outline-none shadow-none"
                maxRows={8}
                minRows={1}
                autoFocus
                autoCorrect="on"
                autoComplete="on"
                autoCapitalize="sentences"
                spellCheck
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
                            style={{ inlineSize: '2.25rem' }}
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
