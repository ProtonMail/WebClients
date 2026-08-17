import { useMemo, useState } from 'react';

import { clsx } from 'clsx';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import {
    Dropdown,
    DropdownMenuButton,
    InputFieldTwo,
    Prompt,
    SimpleDropdown,
    Toggle,
    useModalStateObject,
    useNotifications,
    usePopperAnchor,
} from '@proton/components/index';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoUserSettings } from '../../../hooks';
import { useIsTouchDevice } from '../../../hooks/useIsTouchDevice';
import { useMemoryGeneration } from '../../../hooks/useMemoryGeneration';
import { useLumoDispatch, useLumoStore } from '../../../redux/hooks';
import { appendGeneratedMemoriesThunk } from '../../../redux/slices/lumoUserSettings';
import type { Memory } from '../../../redux/slices/lumoUserSettings';
import {
    MEMORY_AUTO_SAVE_PROMPT_THRESHOLD,
    MEMORY_MAX_CONTENT_LENGTH,
    applyMemoryEdit,
    canOptimizeMemories,
    createMemory,
    getMemoryGenerationCutoff,
    isUserMemory,
    normalizeMemories,
    partitionMemories,
    shouldSuggestMemoryOptimize,
    sortMemoriesByDate,
} from '../../../util/memoryHelpers';
import { LumoIcon } from '../../LumoIcon/LumoIcon';

import './MemoryPanel.scss';

interface MemoryPanelProps {
    onClose?: () => void;
}

const getUserMemoryTipsTitle = () =>
    [
        c('collider_2025: Tip').t`Write stable facts, not one-off questions.`,
        c('collider_2025: Tip').t`Keep each memory short - one preference or fact per line.`,
        c('collider_2025: Tip').t`Include how you like to communicate (tone, format, language).`,
        c('collider_2025: Tip').t`Avoid passwords, tokens, or sensitive personal identifiers.`,
    ].join('\n');

const formatMemoryDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMemoryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayDiff = Math.round((startOfToday - startOfMemoryDay) / (1000 * 60 * 60 * 24));

    if (dayDiff === 0) {
        return c('collider_2025: Date').t`Today`;
    }
    if (dayDiff === 1) {
        return c('collider_2025: Date').t`Yesterday`;
    }

    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
};

const InfoTooltip = ({ title }: { title: string }) => (
    <Tooltip title={title}>
        <span className="memory-panel-info inline-flex items-center color-weak" aria-label={title}>
            <LumoIcon name="Info" size={16} />
        </span>
    </Tooltip>
);

const MemoryEducation = ({ onEnable }: { onEnable?: () => void }) => {
    const facts = [
        {
            title: c('collider_2025: Title').t`Personalizes general chats`,
            body: c('collider_2025: Description')
                .t`${LUMO_SHORT_APP_NAME} references your saved memories to tailor responses — communication style, expertise, recurring tools, and long-running projects.`,
        },
        {
            title: c('collider_2025: Title').t`Never used inside projects`,
            body: c('collider_2025: Description')
                .t`Project chats are kept fully isolated. They rely on their own instructions and files, and ignore your global memories entirely.`,
        },
        {
            title: c('collider_2025: Title').t`You stay in control`,
            body: c('collider_2025: Description')
                .t`Add your own memories, edit any auto-generated entry, or clear everything at any time. Generated memories you edit are promoted to your own.`,
        },
        {
            title: c('collider_2025: Title').t`Zero-access encrypted`,
            body: c('collider_2025: Description').t`Memories are stored encrypted, only you can access them.`,
        },
    ];

    return (
        <section className="flex flex-column flex-nowrap flex-1 min-h-0 overflow-auto">
            <div className="flex flex-row flex-nowrap items-start gap-3 mb-5 pt-5">
                <div className="flex flex-column flex-nowrap gap-1 flex-1 min-w-0">
                    <p className="m-0 text-sm color-weak lh130">
                        {c('collider_2025: Description')
                            .t`Memory lets ${LUMO_SHORT_APP_NAME} remember stable preferences and context across general chats so you don't have to repeat yourself.`}
                    </p>
                </div>
            </div>

            <ul className="unstyled m-0 p-0 flex flex-column flex-nowrap gap-5 mb-5">
                {facts.map((fact) => (
                    <li key={fact.title} className="flex flex-row flex-nowrap items-start gap-3">
                        <span className="shrink-0 inline-flex color-success mt-0.5" aria-hidden="true">
                            <LumoIcon name="Check" size={16} />
                        </span>
                        <div className="flex flex-column flex-nowrap gap-1 flex-1 min-w-0">
                            <p className="m-0 text-sm text-semibold lh130">{fact.title}</p>
                            <p className="m-0 text-sm color-weak lh130">{fact.body}</p>
                        </div>
                    </li>
                ))}
            </ul>

            {onEnable && (
                <div className="flex flex-column flex-nowrap items-center gap-2">
                    <Button shape="solid" color="norm" onClick={onEnable}>
                        {c('collider_2025: Action').t`Turn on memory`}
                    </Button>
                    <span className="text-sm color-weak text-center">
                        {c('collider_2025: Hint').t`You can turn it off again at any time.`}
                    </span>
                </div>
            )}
        </section>
    );
};

interface ToggleRowProps {
    id: string;
    label: string;
    tooltip: string;
    checked: boolean;
    onChange: () => void;
}

const ToggleRow = ({ id, label, tooltip, checked, onChange }: ToggleRowProps) => (
    <div className="flex flex-row flex-nowrap items-center gap-3 py-1">
        <div className="flex flex-row flex-nowrap items-center gap-2 flex-1 min-w-0">
            <span className="text-sm text-semibold">{label}</span>
            <InfoTooltip title={tooltip} />
        </div>
        <Toggle id={id} checked={checked} onChange={onChange} className="shrink-0" />
    </div>
);

interface AddMemoryPopoverProps {
    tipsTitle: string;
    onAdd: (content: string) => void;
    disabled?: boolean;
}

const AddMemoryPopover = ({ tipsTitle, onAdd, disabled = false }: AddMemoryPopoverProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [value, setValue] = useState('');

    const handleClose = () => {
        setValue('');
        close();
    };

    const handleAdd = () => {
        const trimmed = value.trim();
        if (!trimmed) {
            return;
        }
        onAdd(trimmed);
        setValue('');
        close();
    };

    return (
        <>
            <Tooltip title={c('collider_2025: Action').t`Add memory`}>
                <Button
                    ref={anchorRef}
                    icon
                    shape="ghost"
                    size="small"
                    onClick={toggle}
                    disabled={disabled}
                    aria-label={c('collider_2025: Action').t`Add memory`}
                >
                    <LumoIcon name="Plus" size={16} />
                </Button>
            </Tooltip>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={handleClose}
                autoClose={false}
                originalPlacement="bottom-end"
                className="memory-panel-add-popover"
            >
                <div className="flex flex-column flex-nowrap gap-2 p-3">
                    <div className="flex flex-row flex-nowrap items-center gap-1 text-sm text-semibold">
                        <span>{c('collider_2025: Title').t`Add your own memory`}</span>
                        <InfoTooltip title={tipsTitle} />
                    </div>
                    <InputFieldTwo
                        value={value}
                        placeholder={c('collider_2025: Placeholder').t`e.g. I prefer concise, bullet-point answers`}
                        assistContainerClassName="hidden"
                        autoFocus={isOpen}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAdd();
                            } else if (e.key === 'Escape') {
                                e.preventDefault();
                                handleClose();
                            }
                        }}
                    />
                    <Button color="norm" onClick={handleAdd} disabled={!value.trim()}>
                        {c('collider_2025: Action').t`Add`}
                    </Button>
                </div>
            </Dropdown>
        </>
    );
};

interface MemoryActionsMenuProps {
    hasMemories: boolean;
    hasGeneratedMemories: boolean;
    canOptimize: boolean;
    onOptimize: () => void;
    onClearAll: () => void;
    onClearGenerated: () => void;
}

const MemoryActionsMenu = ({
    hasMemories,
    hasGeneratedMemories,
    canOptimize,
    onOptimize,
    onClearAll,
    onClearGenerated,
}: MemoryActionsMenuProps) => {
    if (!hasMemories && !hasGeneratedMemories) {
        return null;
    }

    return (
        <SimpleDropdown
            as={Button}
            icon
            hasCaret={false}
            shape="ghost"
            size="small"
            content={<LumoIcon name="Ellipsis" size={16} aria-label={c('collider_2025: Action').t`More options`} />}
        >
            {canOptimize && (
                <DropdownMenuButton
                    className="flex flex-nowrap items-center gap-2 text-left w-full"
                    onClick={onOptimize}
                >
                    {c('collider_2025: Action').t`Optimize memories`}
                </DropdownMenuButton>
            )}
            {hasGeneratedMemories && (
                <DropdownMenuButton
                    className="flex flex-nowrap items-center gap-2 text-left w-full color-danger"
                    onClick={onClearGenerated}
                >
                    {c('collider_2025: Action').t`Clear auto-generated`}
                </DropdownMenuButton>
            )}
            {hasMemories && (
                <DropdownMenuButton
                    className="flex flex-nowrap items-center gap-2 text-left w-full color-danger"
                    onClick={onClearAll}
                >
                    {c('collider_2025: Action').t`Clear all`}
                </DropdownMenuButton>
            )}
        </SimpleDropdown>
    );
};

interface MemoryRowProps {
    memory: Memory;
    isEditing: boolean;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSaveEdit: (nextContent: string) => void;
    onDelete: () => void;
}

const MemoryRow = ({ memory, isEditing, onStartEdit, onCancelEdit, onSaveEdit, onDelete }: MemoryRowProps) => {
    const [draft, setDraft] = useState(memory.content);

    const handleSave = () => {
        const trimmed = draft.trim();
        if (!trimmed || trimmed === memory.content) {
            onCancelEdit();
            return;
        }
        onSaveEdit(trimmed);
    };

    const isTouchDevice = useIsTouchDevice();

    return (
        <li
            className={clsx(
                'memory-panel-list-item flex flex-row flex-nowrap items-start gap-3 p-3',
                !isTouchDevice && 'group-hover-opacity-container'
            )}
        >
            <div className="flex flex-column flex-nowrap flex-1 min-w-0 gap-1">
                <div className="flex flex-row flex-nowrap items-center gap-2 text-xs color-weak">
                    <time dateTime={new Date(memory.createdAt).toISOString()}>
                        {formatMemoryDate(memory.createdAt)}
                    </time>
                    <span aria-hidden="true">·</span>
                    <span className={`memory-panel-source-pill${isUserMemory(memory) ? '' : ' is-generated'}`}>
                        {isUserMemory(memory)
                            ? c('collider_2025: Label').t`You`
                            : c('collider_2025: Label').t`From chats`}
                    </span>
                </div>

                {isEditing ? (
                    <InputFieldTwo
                        as="textarea"
                        rows={2}
                        autoFocus
                        value={draft}
                        maxLength={MEMORY_MAX_CONTENT_LENGTH}
                        assistContainerClassName="hidden"
                        className="memory-panel-edit-field w-full"
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                onCancelEdit();
                            } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                e.preventDefault();
                                handleSave();
                            }
                        }}
                    />
                ) : (
                    <p className="m-0 text-sm lh130 text-break w-full">{memory.content}</p>
                )}
            </div>

            <div
                className={clsx(
                    'flex flex-row flex-nowrap items-center gap-0 shrink-0',
                    !isTouchDevice && !isEditing && 'group-hover:opacity-100'
                )}
            >
                {isEditing ? (
                    <>
                        <Tooltip title={c('collider_2025: Action').t`Save (⌘+Enter)`}>
                            <Button
                                shape="ghost"
                                size="small"
                                icon
                                color="success"
                                onClick={handleSave}
                                disabled={!draft.trim()}
                                aria-label={c('collider_2025: Action').t`Save`}
                            >
                                <LumoIcon name="Check" size={16} />
                            </Button>
                        </Tooltip>
                        <Tooltip title={c('collider_2025: Action').t`Cancel (Esc)`}>
                            <Button
                                shape="ghost"
                                size="small"
                                icon
                                onClick={onCancelEdit}
                                aria-label={c('collider_2025: Action').t`Cancel`}
                            >
                                <LumoIcon name="X" size={16} />
                            </Button>
                        </Tooltip>
                    </>
                ) : (
                    <>
                        <Tooltip title={c('collider_2025: Action').t`Edit memory`}>
                            <Button
                                shape="ghost"
                                size="small"
                                icon
                                onClick={onStartEdit}
                                aria-label={c('collider_2025: Action').t`Edit memory`}
                            >
                                <LumoIcon name="Pencil" size={16} />
                            </Button>
                        </Tooltip>
                        <Tooltip title={c('collider_2025: Action').t`Delete memory`}>
                            <Button
                                shape="ghost"
                                size="small"
                                icon
                                onClick={onDelete}
                                aria-label={c('collider_2025: Action').t`Delete memory`}
                            >
                                <LumoIcon name="Trash2" size={16} />
                            </Button>
                        </Tooltip>
                    </>
                )}
            </div>
        </li>
    );
};

const MemoryPanel = ({ onClose: _onClose }: MemoryPanelProps) => {
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const { createNotification } = useNotifications();
    const {
        generateFromChats,
        optimizeMemories,
        canGenerateFromChats,
        isGenerating,
        isBootstrapping,
        isOptimizing,
    } = useMemoryGeneration();
    const dispatch = useLumoDispatch();
    const store = useLumoStore();

    const [editingId, setEditingId] = useState<string | null>(null);
    const clearAllModal = useModalStateObject();
    const clearGeneratedModal = useModalStateObject();
    const disableMemoryModal = useModalStateObject();
    const optimizeModal = useModalStateObject();

    const memories = useMemo(
        () => sortMemoriesByDate(normalizeMemories(lumoUserSettings.memories)),
        [lumoUserSettings.memories]
    );
    const memoryGenerationCutoff = useMemo(
        () => getMemoryGenerationCutoff(lumoUserSettings.memoryLastProcessedMessageAt, memories),
        [lumoUserSettings.memoryLastProcessedMessageAt, memories]
    );
    const { user: userMemories, generated: generatedMemories } = useMemo(() => partitionMemories(memories), [memories]);

    const isMemoryEnabled = lumoUserSettings.isMemoryEnabled === true;
    const isMemoryAutoSaveEnabled = lumoUserSettings.isMemoryAutoSaveEnabled ?? true;
    const newPromptsSinceLastUpdate = lumoUserSettings.memoryPromptsSinceAutoSave ?? 0;
    const promptsUntilAutoSave = Math.max(0, MEMORY_AUTO_SAVE_PROMPT_THRESHOLD - newPromptsSinceLastUpdate);
    const hasMemories = memories.length > 0;
    const canOptimize = canOptimizeMemories(memories.length);
    const suggestOptimize = shouldSuggestMemoryOptimize(memories);
    const hasNewChats = newPromptsSinceLastUpdate > 0;
    const showUpdateFromChatsButton = hasMemories && hasNewChats;

    const persistMemories = (next: Memory[], extra: Partial<typeof lumoUserSettings> = {}) => {
        updateSettings({
            memories: normalizeMemories(next),
            ...(memoryGenerationCutoff && { memoryLastProcessedMessageAt: memoryGenerationCutoff }),
            _autoSave: true,
            ...extra,
        });
    };

    const handleAddMemory = (content: string) => {
        persistMemories([createMemory(content, 'user'), ...memories]);
    };

    const handleDeleteMemory = (id: string) => {
        if (editingId === id) {
            setEditingId(null);
        }
        persistMemories(memories.filter((memory) => memory.id !== id));
    };

    const handleSaveEdit = (id: string, nextContent: string) => {
        const next = memories.map((memory) => (memory.id === id ? applyMemoryEdit(memory, nextContent) : memory));
        persistMemories(next);
        setEditingId(null);
    };

    const handleClearAllMemories = () => {
        setEditingId(null);
        persistMemories([], { memoryPromptsSinceAutoSave: 0 });
        clearAllModal.openModal(false);
    };

    const handleClearGeneratedMemories = () => {
        setEditingId(null);
        persistMemories(userMemories);
        clearGeneratedModal.openModal(false);
    };

    const performDisableMemory = () => {
        setEditingId(null);
        updateSettings({
            isMemoryEnabled: false,
            memories: [],
            memoryPromptsSinceAutoSave: 0,
            memoryLastProcessedMessageAt: undefined,
            _autoSave: true,
        });
    };

    const handleToggleEnableMemory = () => {
        if (isMemoryEnabled) {
            // Disabling memory wipes all saved memories — confirm first if there's something to lose.
            if (hasMemories) {
                disableMemoryModal.openModal(true);
                return;
            }
            performDisableMemory();
            return;
        }
        updateSettings({
            isMemoryEnabled: true,
            memoryPromptsSinceAutoSave: 0,
            memoryLastProcessedMessageAt: undefined,
            _autoSave: true,
        });
    };

    const handleConfirmDisableMemory = () => {
        disableMemoryModal.openModal(false);
        performDisableMemory();
    };

    const handleGenerationError = (error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') {
            return;
        }
        createNotification({
            type: 'error',
            text: c('collider_2025: Error').t`Something went wrong. Please try again.`,
        });
    };

    const handleUpdateFromChats = async () => {
        try {
            // Read memories from the latest store state, not the render snapshot — otherwise
            // a clear-all followed immediately by a click could still produce a stale closure
            // (and an incorrectly "incremental" prompt instead of a fresh bootstrap).
            const latestMemories = normalizeMemories(store.getState().lumoUserSettings.memories);
            const { generated, processedThrough } = await generateFromChats(latestMemories);
            if (generated.length === 0) {
                updateSettings({ memoryPromptsSinceAutoSave: 0, _autoSave: true });
                createNotification({
                    type: 'info',
                    text: c('collider_2025: Info').t`No new memories were found in your recent chats.`,
                });
                return;
            }

            // Merge against the *latest* state (not the snapshot taken before the LLM call),
            // otherwise edits/adds made during generation would be clobbered.
            const added = dispatch(appendGeneratedMemoriesThunk(generated, processedThrough));

            if (added === 0) {
                createNotification({
                    type: 'info',
                    text: c('collider_2025: Info').t`Your memories are already up to date.`,
                });
            } else {
                createNotification({
                    type: 'success',
                    text: c('collider_2025: Success').ngettext(
                        msgid`Added ${added} memory from your chats`,
                        `Added ${added} memories from your chats`,
                        added
                    ),
                });
            }
        } catch (error) {
            handleGenerationError(error);
        }
    };

    const getMemoryContentsKey = (nextMemories: Memory[]) =>
        normalizeMemories(nextMemories)
            .map((memory) => memory.content.toLowerCase())
            .sort()
            .join('\n');

    const handleConfirmOptimizeMemories = async () => {
        try {
            const latestMemories = normalizeMemories(store.getState().lumoUserSettings.memories);
            const beforeCount = latestMemories.length;
            const beforeKey = getMemoryContentsKey(latestMemories);
            const optimized = await optimizeMemories(latestMemories);
            const afterKey = getMemoryContentsKey(optimized);

            optimizeModal.openModal(false);
            setEditingId(null);

            if (beforeKey === afterKey) {
                createNotification({
                    type: 'info',
                    text: c('collider_2025: Info').t`Your memories are already well organized.`,
                });
                return;
            }

            persistMemories(optimized);

            const removed = beforeCount - optimized.length;
            if (removed > 0) {
                createNotification({
                    type: 'success',
                    text: c('collider_2025: Success').t`Optimized memories: reduced from ${beforeCount} to ${optimized.length}.`,
                });
            } else {
                createNotification({
                    type: 'success',
                    text: c('collider_2025: Success').t`Memories optimized successfully.`,
                });
            }
        } catch (error) {
            handleGenerationError(error);
        }
    };

    if (!isMemoryEnabled) {
        return (
            <div className="memory-panel flex flex-column flex-nowrap h-full min-h-0 min-w-0 overflow-hidden">
                <MemoryEducation onEnable={handleToggleEnableMemory} />
            </div>
        );
    }

    const disableMemoryText = c('collider_2025: DisableMemory')
        .t`Deletes all saved memories and turns off the memory feature.`;

    const autoUpdateTooltip = isMemoryAutoSaveEnabled
        ? promptsUntilAutoSave === 0
            ? c('collider_2025: Tooltip')
                  .t`Every ${MEMORY_AUTO_SAVE_PROMPT_THRESHOLD} messages in general chats, ${LUMO_SHORT_APP_NAME} extracts short excerpts and adds new chat-based memories in the background.`
            : c('collider_2025: Tooltip').ngettext(
                  msgid`${LUMO_SHORT_APP_NAME} updates chat-based memories every ${MEMORY_AUTO_SAVE_PROMPT_THRESHOLD} messages. ${promptsUntilAutoSave} message left until the next update.`,
                  `${LUMO_SHORT_APP_NAME} updates chat-based memories every ${MEMORY_AUTO_SAVE_PROMPT_THRESHOLD} messages. ${promptsUntilAutoSave} messages left until the next update.`,
                  promptsUntilAutoSave
              )
        : c('collider_2025: Tooltip')
              .t`When enabled, ${LUMO_SHORT_APP_NAME} updates chat-based memories every ${MEMORY_AUTO_SAVE_PROMPT_THRESHOLD} messages in general chats. Only short excerpts are sent.`;

    const updateButtonLabel =
        newPromptsSinceLastUpdate > 0
            ? c('collider_2025: Action').ngettext(
                  msgid`Update from chats (${newPromptsSinceLastUpdate} new)`,
                  `Update from chats (${newPromptsSinceLastUpdate} new)`,
                  newPromptsSinceLastUpdate
              )
            : c('collider_2025: Action').t`Update from chats`;

    const memoryTipsTitle = getUserMemoryTipsTitle();

    return (
        <div className="memory-panel flex flex-column flex-nowrap h-full min-h-0 min-w-0 overflow-hidden">
            <div className="flex flex-column flex-nowrap flex-1 gap-2 min-h-0 overflow-hidden pb-1">
                {isMemoryEnabled && (
                    <div className="flex flex-column flex-nowrap gap-2 shrink-0">
                        <ToggleRow
                            id="memory-autosave-toggle"
                            label={c('collider_2025: Title').t`Auto update memory`}
                            tooltip={autoUpdateTooltip}
                            checked={isMemoryAutoSaveEnabled}
                            onChange={() => {
                                updateSettings({
                                    isMemoryAutoSaveEnabled: !isMemoryAutoSaveEnabled,
                                    _autoSave: true,
                                });
                            }}
                        />
                    </div>
                )}

                {isMemoryEnabled && (
                    <div className="flex flex-column flex-nowrap flex-1 min-h-0 gap-2">
                        <h3 className="memory-panel-section-title m-0 text-sm text-semibold shrink-0">
                            {c('collider_2025: Title').t`Saved memories`}
                            {hasMemories && <span className="color-weak text-normal"> ({memories.length})</span>}
                        </h3>

                        {suggestOptimize && (
                            <p className="memory-panel-optimize-hint m-0 text-sm color-weak shrink-0">
                                {c('collider_2025: Info')
                                    .t`You have many saved memories. Use Optimize in the menu to merge duplicates and keep the list focused.`}
                            </p>
                        )}

                        <section className="memory-panel-main flex flex-column flex-nowrap flex-1 min-h-0 rounded-lg border border-weak bg-weak overflow-hidden">
                            <header className="shrink-0 flex flex-row flex-nowrap items-center justify-space-between gap-2 py-2 px-3 border-bottom border-weak bg-norm">
                                <div className="flex flex-row flex-nowrap items-center min-w-0">
                                    {showUpdateFromChatsButton && (
                                        <Button
                                            shape="ghost"
                                            size="small"
                                            color="norm"
                                            onClick={handleUpdateFromChats}
                                            disabled={!canGenerateFromChats || isGenerating}
                                            loading={isBootstrapping}
                                            className="flex flex-row flex-nowrap items-center text-sm"
                                        >
                                            <LumoIcon name="WandSparkles" size={14} className="mr-2" />
                                            {updateButtonLabel}
                                        </Button>
                                    )}
                                </div>
                                <div className="flex flex-row flex-nowrap items-center gap-1 shrink-0">
                                    <AddMemoryPopover tipsTitle={memoryTipsTitle} onAdd={handleAddMemory} />
                                    <MemoryActionsMenu
                                        hasMemories={hasMemories}
                                        hasGeneratedMemories={generatedMemories.length > 0}
                                        canOptimize={canOptimize}
                                        onOptimize={() => optimizeModal.openModal(true)}
                                        onClearAll={() => clearAllModal.openModal(true)}
                                        onClearGenerated={() => clearGeneratedModal.openModal(true)}
                                    />
                                </div>
                            </header>

                            {hasMemories ? (
                                <ul className="memory-panel-list unstyled m-0 p-0 flex-1 min-h-0 overflow-y-auto">
                                    {memories.map((memory) => (
                                        <MemoryRow
                                            key={memory.id}
                                            memory={memory}
                                            isEditing={editingId === memory.id}
                                            onStartEdit={() => setEditingId(memory.id)}
                                            onCancelEdit={() => setEditingId(null)}
                                            onSaveEdit={(next) => handleSaveEdit(memory.id, next)}
                                            onDelete={() => handleDeleteMemory(memory.id)}
                                        />
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex flex-column flex-nowrap items-center justify-center gap-2 py-6 px-4 text-center flex-1 min-h-0 overflow-y-auto">
                                    <span className="memory-panel-empty-icon mb-1" aria-hidden="true">
                                        <LumoIcon name="Archive" size={20} />
                                    </span>
                                    <p className="m-0 text-sm text-semibold">
                                        {c('collider_2025: Title').t`No memories yet`}
                                    </p>
                                    <p className="memory-panel-empty-hint m-0 text-sm color-weak lh130">
                                        {c('collider_2025: Info')
                                            .t`Generate them from your recent chats, or add one with + above.`}
                                    </p>
                                    <Button
                                        className="mt-2"
                                        shape="solid"
                                        size="small"
                                        color="norm"
                                        onClick={handleUpdateFromChats}
                                        disabled={!canGenerateFromChats}
                                        loading={isBootstrapping}
                                    >
                                        <LumoIcon name="WandSparkles" size={16} className="mr-2" />
                                        {c('collider_2025: Action').t`Generate from chats`}
                                    </Button>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>

            {isMemoryEnabled && (
                <div className="shrink-0 flex flex-row flex-nowrap items-center gap-2 justify-space-between pt-3">
                    <span className="text-sm color-hint">{disableMemoryText}</span>
                    <Button
                        onClick={handleToggleEnableMemory}
                        color="danger"
                        shape="outline"
                        size="small"
                        className="text-sm md:text-rg"
                    >
                        {c('collider_2025: Action').t`Turn off memory`}
                    </Button>
                </div>
            )}

            <Prompt
                {...optimizeModal.modalProps}
                title={c('collider_2025: Title').t`Optimize memories?`}
                buttons={[
                    <Button
                        key="confirm"
                        color="norm"
                        loading={isOptimizing}
                        onClick={handleConfirmOptimizeMemories}
                    >
                        {c('collider_2025: Action').t`Optimize`}
                    </Button>,
                    <Button key="cancel" onClick={optimizeModal.modalProps.onClose} disabled={isOptimizing}>
                        {c('collider_2025: Action').t`Cancel`}
                    </Button>,
                ]}
            >
                <p className="m-0">
                    {c('collider_2025: Description')
                        .t`${LUMO_SHORT_APP_NAME} will review your saved memories, remove duplicates, and merge related entries into clearer ones. Your memory list will be replaced with the optimized result.`}
                </p>
            </Prompt>

            <Prompt
                {...clearGeneratedModal.modalProps}
                title={c('collider_2025: Title').t`Clear chat-based memories?`}
                buttons={[
                    <Button key="confirm" color="danger" onClick={handleClearGeneratedMemories}>
                        {c('collider_2025: Action').t`Clear`}
                    </Button>,
                    <Button key="cancel" onClick={clearGeneratedModal.modalProps.onClose}>
                        {c('collider_2025: Action').t`Cancel`}
                    </Button>,
                ]}
            >
                <p className="m-0">
                    {c('collider_2025: Description')
                        .t`This removes memories generated from your chats. Memories you added yourself will be kept.`}
                </p>
            </Prompt>

            <Prompt
                {...disableMemoryModal.modalProps}
                title={c('collider_2025: Title').t`Turn off memory?`}
                buttons={[
                    <Button key="confirm" color="danger" onClick={handleConfirmDisableMemory}>
                        {c('collider_2025: Action').t`Turn off and delete`}
                    </Button>,
                    <Button key="cancel" onClick={disableMemoryModal.modalProps.onClose}>
                        {c('collider_2025: Action').t`Cancel`}
                    </Button>,
                ]}
            >
                <p className="m-0">
                    {c('collider_2025: Description')
                        .t`Turning off memory will permanently delete all ${memories.length} saved memories. You can turn on memory later, but the deleted memories cannot be recovered.`}
                </p>
            </Prompt>

            <Prompt
                {...clearAllModal.modalProps}
                title={c('collider_2025: Title').t`Clear all memories?`}
                buttons={[
                    <Button key="confirm" color="danger" onClick={handleClearAllMemories}>
                        {c('collider_2025: Action').t`Clear all`}
                    </Button>,
                    <Button key="cancel" onClick={clearAllModal.modalProps.onClose}>
                        {c('collider_2025: Action').t`Cancel`}
                    </Button>,
                ]}
            >
                <p className="m-0">
                    {c('collider_2025: Description')
                        .t`This will permanently remove all saved memories. ${LUMO_SHORT_APP_NAME} will no longer use them in future chats.`}
                </p>
            </Prompt>
        </div>
    );
};

export default MemoryPanel;
