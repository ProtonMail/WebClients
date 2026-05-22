import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { InputFieldTwo, Prompt, Toggle, useModalStateObject, useNotifications } from '@proton/components/index';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { IcMagicWand } from '@proton/icons/icons/IcMagicWand';
import { IcPencil } from '@proton/icons/icons/IcPencil';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import {IcArchiveBox} from "@proton/icons/icons/IcArchiveBox";

import { useLumoUserSettings } from '../../../hooks';
import { useMemoryGeneration } from '../../../hooks/useMemoryGeneration';
import { useLumoDispatch, useLumoStore } from '../../../redux/hooks';
import { appendGeneratedMemoriesThunk } from '../../../redux/slices/lumoUserSettings';
import type { Memory } from '../../../redux/slices/lumoUserSettings';

import {
    applyMemoryEdit,
    createMemory,
    isUserMemory,
    MEMORY_AUTO_SAVE_PROMPT_THRESHOLD,
    MEMORY_MAX_CONTENT_LENGTH,
    normalizeMemories,
    partitionMemories,
    sortMemoriesByDate,
} from '../../../util/memoryHelpers';
import './MemoryPanel.scss';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

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
            <IcInfoCircle size={4} />
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
            title: c('collider_2025: Title').t`End-to-end encrypted`,
            body: c('collider_2025: Description')
                .t`Memories are stored encrypted.`,
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
                            <IcCheckmark size={4} />
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
                        {c('collider_2025: Action').t`Enable memory`}
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

    return (
        <li className="memory-panel-list-item flex flex-row flex-nowrap items-start gap-3 p-3 group-hover-opacity-container">
            <div className="flex flex-column flex-nowrap flex-1 min-w-0 gap-1">
                <div className="flex flex-row flex-nowrap items-center gap-2 text-xs color-weak">
                    <time dateTime={new Date(memory.createdAt).toISOString()}>{formatMemoryDate(memory.createdAt)}</time>
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
                        className='memory-panel-edit-field w-full'
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

            <div className={`flex flex-row flex-nowrap items-center gap-0 shrink-0${isEditing ? '' : ' group-hover:opacity-100'}`}>
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
                                <IcCheckmark size={4} />
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
                                <IcCross size={4} />
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
                                <IcPencil size={4} />
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
                                <IcTrash size={4} />
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
    const { generateFromChats, canGenerateFromChats, isGenerating, isBootstrapping } = useMemoryGeneration();
    const dispatch = useLumoDispatch();
    const store = useLumoStore();

    const [newMemory, setNewMemory] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const clearAllModal = useModalStateObject();
    const clearGeneratedModal = useModalStateObject();
    const disableMemoryModal = useModalStateObject();

    const memories = useMemo(
        () => sortMemoriesByDate(normalizeMemories(lumoUserSettings.memories)),
        [lumoUserSettings.memories]
    );
    const { user: userMemories, generated: generatedMemories } = useMemo(
        () => partitionMemories(memories),
        [memories]
    );

    const isMemoryEnabled = lumoUserSettings.isMemoryEnabled ?? true;
    const isMemoryAutoSaveEnabled = lumoUserSettings.isMemoryAutoSaveEnabled ?? true;
    const newPromptsSinceLastUpdate = lumoUserSettings.memoryPromptsSinceAutoSave ?? 0;
    const promptsUntilAutoSave = Math.max(0, MEMORY_AUTO_SAVE_PROMPT_THRESHOLD - newPromptsSinceLastUpdate);
    const hasMemories = memories.length > 0;
    const hasNewChats = newPromptsSinceLastUpdate > 0;

    const persistMemories = (next: Memory[], extra: Partial<typeof lumoUserSettings> = {}) => {
        updateSettings({ memories: next, _autoSave: true, ...extra });
    };

    const handleAddMemory = () => {
        const trimmed = newMemory.trim();
        if (!trimmed) {
            return;
        }
        persistMemories([createMemory(trimmed, 'user'), ...memories]);
        setNewMemory('');
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
        updateSettings({ isMemoryEnabled: true, _autoSave: true });
    };

    const handleConfirmDisableMemory = () => {
        performDisableMemory();
        disableMemoryModal.openModal(false);
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
            const generated = await generateFromChats(latestMemories);
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
            const added = dispatch(appendGeneratedMemoriesThunk(generated));

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

    const enableMemoryTooltip = c('collider_2025: Tooltip')
        .t`${LUMO_SHORT_APP_NAME} uses saved memories to personalize general chats. Memories are not used in project chats.`;

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
        <div className="flex flex-column flex-nowrap h-full min-h-0 min-w-0 overflow-hidden">
            <div className="flex flex-column flex-nowrap flex-1 gap-4 min-h-0 overflow-hidden pb-1">
                {isMemoryEnabled && (
                    <div className="flex flex-column flex-nowrap">
                        <ToggleRow
                            id="memory-enabled-toggle"
                            label={c('collider_2025: Title').t`Enable memory`}
                            tooltip={enableMemoryTooltip}
                            checked={isMemoryEnabled}
                            onChange={handleToggleEnableMemory}
                        />
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

                {!isMemoryEnabled && <MemoryEducation onEnable={handleToggleEnableMemory} />}

                {isMemoryEnabled && (
                    <section className="flex flex-column flex-nowrap flex-1 min-h-0 rounded-lg border border-weak bg-weak overflow-hidden">
                        <header className="flex flex-row flex-nowrap items-center justify-space-between gap-2 py-2 px-3 border-bottom border-weak bg-norm">
                            <div className="flex flex-row flex-nowrap items-center gap-1 text-sm text-semibold">
                                <span>{c('collider_2025: Title').t`Saved memories`}</span>
                                {hasMemories && (
                                    <span className="color-weak text-normal">({memories.length})</span>
                                )}
                            </div>
                            {hasMemories && hasNewChats && (
                                <Button
                                    shape="ghost"
                                    size="small"
                                    color="norm"
                                    onClick={handleUpdateFromChats}
                                    disabled={!canGenerateFromChats || isGenerating}
                                    loading={isBootstrapping}
                                >
                                    <IcMagicWand size={4} className="mr-2" />
                                    {updateButtonLabel}
                                </Button>
                            )}
                        </header>

                        {hasMemories ? (
                            <ul className="unstyled m-0 p-0 flex-1 min-h-0 overflow-auto">
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
                            <div className="flex flex-column flex-nowrap items-center justify-center gap-2 py-6 px-4 text-center flex-1 min-h-0">
                                <span className="memory-panel-empty-icon mb-1" aria-hidden="true">
                                    <IcArchiveBox size={5} />
                                </span>
                                <p className="m-0 text-sm text-semibold">
                                    {c('collider_2025: Title').t`No memories yet`}
                                </p>
                                <p className="memory-panel-empty-hint m-0 text-sm color-weak lh130">
                                    {c('collider_2025: Info')
                                        .t`Generate them from your recent chats, or add your own below.`}
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
                                    <IcMagicWand size={4} className="mr-2" />
                                    {c('collider_2025: Action').t`Generate from chats`}
                                </Button>
                            </div>
                        )}

                        {hasMemories && (
                            <footer className="flex flex-row flex-nowrap items-center justify-end gap-1 py-1 px-2 border-top border-weak bg-norm">
                                {generatedMemories.length > 0 && (
                                    <Button
                                        shape="ghost"
                                        size="small"
                                        color="danger"
                                        onClick={() => clearGeneratedModal.openModal(true)}
                                    >
                                        {c('collider_2025: Action').t`Clear auto-generated`}
                                    </Button>
                                )}
                                <Button
                                    shape="ghost"
                                    size="small"
                                    color="danger"
                                    onClick={() => clearAllModal.openModal(true)}
                                >
                                    {c('collider_2025: Action').t`Clear all`}
                                </Button>
                            </footer>
                        )}
                    </section>
                )}
            </div>

            {isMemoryEnabled && (
                <div className="shrink-0 flex flex-column flex-nowrap gap-2 pt-3">
                    <div className="flex flex-row flex-nowrap items-center gap-1 text-sm text-semibold">
                        <span>{c('collider_2025: Title').t`Add your own memory`}</span>
                        <InfoTooltip title={memoryTipsTitle} />
                    </div>
                    <div className="flex flex-row flex-nowrap items-stretch gap-2">
                        <div className="flex-1 min-w-0">
                            <InputFieldTwo
                                value={newMemory}
                                placeholder={c('collider_2025: Placeholder')
                                    .t`e.g. I prefer concise, bullet-point answers`}
                                assistContainerClassName="hidden"
                                onChange={(e) => setNewMemory(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddMemory();
                                    }
                                }}
                            />
                        </div>
                        <Button
                            className="shrink-0"
                            color="norm"
                            onClick={handleAddMemory}
                            disabled={!newMemory.trim()}
                        >
                            {c('collider_2025: Action').t`Add`}
                        </Button>
                    </div>
                    <p className="m-0 text-xs color-weak lh130">
                        {c('collider_2025: Hint')
                            .t`Memory is only used in general chats — never inside projects. Stored end-to-end encrypted.`}
                    </p>
                </div>
            )}

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
                        .t`Turning off memory will permanently delete all ${memories.length} saved memories. You can re-enable memory later, but the deleted memories cannot be recovered.`}
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
