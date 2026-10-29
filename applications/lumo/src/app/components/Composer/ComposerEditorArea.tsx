import { useEffect, useMemo, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import lumoStart from '@proton/styles/assets/img/illustrations/lumo-arrow.svg';
import lumoStop from '@proton/styles/assets/img/illustrations/lumo-stop.svg';

import type useComposerInput from '../../hooks/useComposerInput';
import type { DriveNode } from '../../hooks/useDriveSDK';
import type { Message, SpaceId } from '../../types';
import { isImeComposing } from '../../util/keyboard';
import { FileMentionComponent } from './FileMentionComponent';
import { SkillCommandMenu } from './SkillCommandMenu';
import { SkillTokenHighlight, useSkillTokens } from './SkillTokenHighlight';
import { type DriveSDKFunctions, useFileMentionAutocomplete } from './hooks/useFileMentionAutocomplete';
import { useMobilePromptHandler } from './hooks/useMobilePromptHandler';
import { useSkillCommandAutocomplete } from './hooks/useSkillCommandAutocomplete';

export interface ComposerEditorAreaProps {
    composerInput: ReturnType<typeof useComposerInput>;
    canShowSendButton: boolean;
    sendIsDisabled: boolean;
    isDictating?: boolean;
    isGenerating: boolean;
    isProcessingAttachment: boolean;
    onAbort?: () => void;
    onSubmit: () => void;
    spaceId?: SpaceId;
    messageChain?: Message[];
    isAutocompleteActiveRef?: React.MutableRefObject<boolean>;
    placeholder?: string;
    // Optional Drive SDK functions - only provided for authenticated users
    browseFolderChildren?: (folderId?: string, forceRefresh?: boolean) => Promise<DriveNode[]>;
    downloadFile?: (nodeId: string) => Promise<ArrayBuffer>;
    userId?: string;
}

export const ComposerEditorArea = ({
    composerInput,
    canShowSendButton,
    sendIsDisabled,
    isDictating = false,
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
    const {
        value,
        setValue,
        textareaRef,
        handleChange,
        handleKeyDown,
        handlePaste,
        updateCursorPosition,
        onFocus,
        onBlur,
    } = composerInput;

    const driveSDK: DriveSDKFunctions | undefined = useMemo(() => {
        if (browseFolderChildren && downloadFile) {
            return {
                browseFolderChildren: async (folderId?: string, forceRefresh?: boolean) => {
                    const nodes = await browseFolderChildren(folderId, forceRefresh);
                    return nodes.map((node) => ({
                        id: node.nodeUid,
                        name: node.name,
                        type: node.type,
                        mediaType: node.mediaType,
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
        userId,
        messageChain
    );

    const { skillCommandState, skillCommands, skillHandles, selectSkillCommand, closeSkillCommand } =
        useSkillCommandAutocomplete(textareaRef, value, setValue);
    const skillTokens = useSkillTokens(value, skillHandles);

    const [selectedIndex, setSelectedIndex] = useState(0);

    // At most one menu is open: `/` and `@` triggers can't both end at the cursor.
    const autocomplete = skillCommandState.isActive
        ? {
              kind: 'skill' as const,
              count: skillCommands.length,
              select: (index: number) => {
                  if (skillCommands[index]) selectSkillCommand(skillCommands[index]);
              },
              close: closeSkillCommand,
          }
        : mentionState.isActive
          ? {
                kind: 'file' as const,
                count: files.length,
                select: (index: number) => {
                    if (files[index]) void selectFile(files[index]);
                },
                close: closeMention,
            }
          : undefined;

    const autocompleteRef = useRef(autocomplete);
    const onSubmitRef = useRef(onSubmit);

    useEffect(() => {
        autocompleteRef.current = autocomplete;
    });
    useEffect(() => {
        onSubmitRef.current = onSubmit;
    }, [onSubmit]);

    const activeKind = autocomplete?.kind;
    const prevActiveKindRef = useRef<typeof activeKind>(undefined);
    useEffect(() => {
        if (isAutocompleteActiveRef) {
            isAutocompleteActiveRef.current = !!activeKind;
        }
        if (activeKind && activeKind !== prevActiveKindRef.current) {
            setSelectedIndex(0);
        }
        prevActiveKindRef.current = activeKind;
    }, [activeKind, isAutocompleteActiveRef]);

    const optionCount = autocomplete?.count ?? 0;
    useEffect(() => {
        if (selectedIndex >= optionCount && optionCount > 0) {
            setSelectedIndex(optionCount - 1);
        }
    }, [optionCount, selectedIndex]);

    // Handle autocomplete keyboard navigation on top of the normal handleKeyDown
    const handleKeyDownWithAutocomplete = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // While an IME composition is in progress, Enter confirms the composition candidate.
        // Don't treat it as a mention selection or message submission.
        if (e.key === 'Enter' && isImeComposing(e)) {
            return;
        }
        const active = autocompleteRef.current;
        if (isDictating && e.key === 'Enter' && !e.shiftKey && !active && !isImeComposing(e)) {
            e.preventDefault();
            return;
        }
        if (active) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) => (prev < active.count - 1 ? prev + 1 : prev));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                return;
            }
            if (e.key === 'Enter' || (e.key === 'Tab' && active.kind === 'skill' && active.count > 0)) {
                if (active.count > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    active.select(selectedIndex);
                } else if (!e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    active.close();
                    onSubmitRef.current?.();
                }
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                active.close();
                return;
            }
        }
        // Fall through to normal key handling
        handleKeyDown(e);
        updateCursorPosition();
    };

    useMobilePromptHandler(setValue, textareaRef);

    return (
        <div className="lumo-input border-none flex-grow w-full z-30 flex flex-row flex-nowrap items-end gap-3 p-2 pl-3 my-auto bg-norm relative">
            <div className={clsx('composer-text-wrapper', skillTokens.isActive && 'has-skill-tokens')}>
                {skillTokens.isActive && <SkillTokenHighlight textareaRef={textareaRef} parts={skillTokens.parts} />}
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
                    autoFocus={!isMobile()}
                    autoCorrect="on"
                    autoComplete="on"
                    autoCapitalize="sentences"
                    spellCheck
                    readOnly={isDictating}
                />
            </div>

            <FileMentionComponent
                mentionState={mentionState}
                files={files}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
                selectFile={selectFile}
            />
            <SkillCommandMenu
                state={skillCommandState}
                commands={skillCommands}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
                onSelect={selectSkillCommand}
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
                            style={{ inlineSize: '2rem', transform: 'scale(1.125)', transformOrigin: 'center' }}
                            disabled={sendIsDisabled}
                            onClick={isGenerating ? onAbort : onSubmit}
                            color="norm"
                        >
                            <img
                                src={isGenerating ? lumoStop : lumoStart}
                                draggable={false}
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
