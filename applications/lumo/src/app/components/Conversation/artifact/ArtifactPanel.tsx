import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { isMac } from '@proton/shared/lib/helpers/browser';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';

import { useArtifactPanelSpotlight } from '../../../hooks/useArtifactPanelSpotlight';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useArtifactPanelHostActions } from '../../../providers/ArtifactPanelHostProvider';
import { useConversationActions } from '../../../providers/ConversationActionsProvider';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import {
    sendArtifactContentCopiedEvent,
    sendArtifactVersionHistoryOpenedEvent,
    sendArtifactVersionSelectedEvent,
    sendArtifactWebpageViewToggledEvent,
} from '../../../util/telemetry';
import type { ArtifactVersionSelectSource } from '../../../util/telemetry';
import { useNativeComposerVisibilityApi } from '../../Composer/hooks/useNativeComposerVisibilityApi';
import { LumoIcon } from '../../LumoIcon/LumoIcon';
import type { ArtifactMenuFormatOption } from './ArtifactActionsDropdown';
import { ArtifactContent } from './ArtifactContent';
import type { WebpageViewMode } from './ArtifactContent';
import { useArtifactContext } from './ArtifactContext';
import { ArtifactExportOverlay } from './ArtifactExportOverlay';
import { ArtifactInlineEdit } from './ArtifactInlineEdit';
import { ArtifactOlderVersionBanner } from './ArtifactOlderVersionBanner';
import { ArtifactPanelLoading } from './ArtifactPanelLoading';
import { ArtifactPanelRevisionOverlay } from './ArtifactPanelRevisionOverlay';
import { ArtifactPanelSpotlight } from './ArtifactPanelSpotlight';
import { ArtifactPreviewErrorBoundary } from './ArtifactPreviewErrorBoundary';
import type { ArtifactRichTextEditorHandle } from './ArtifactRichTextEditor';
import { ArtifactTitleMenu } from './ArtifactTitleMenu';
import { ArtifactViewModeToggle } from './ArtifactViewModeToggle';
import type { ArtifactVersion } from './artifactRegistry';
import { normalizeDocumentCardFences } from './artifactVizCards';
import type { ArtifactType } from './parseArtifacts';
import { useArtifactFileActions } from './useArtifactFileActions';

import './ArtifactPanel.scss';

// Loaded only when the user starts a manual edit: tiptap/ProseMirror stay out of the read-only panel.
const ArtifactRichTextEditor = lazy(() => {
    return import(/* webpackChunkName: "artifact-rich-editor" */ './ArtifactRichTextEditor');
});

const loadNormalizeMarkdownForEditor = async () => {
    const module = await import(
        /* webpackChunkName: "artifact-rich-editor" */ '../../../util/markdown/markdownEditorDoc'
    );
    return module.normalizeMarkdownForEditor;
};

/** Rich text (WYSIWYG) by default; markdown source as an escape hatch and a fallback. */
type ManualEditMode = 'rich' | 'source';

// ---------------------------------------------------------------------------
// Shared panel header
// ---------------------------------------------------------------------------

interface PanelHeaderProps {
    type?: ArtifactType;
    language?: string;
    title?: string;
    isStreaming: boolean;
    exportingDownload?: boolean;
    exportHeaderStatusLabel?: string;
    onClose: () => void;
    versionIndex?: number;
    versions?: ArtifactVersion[];
    onOpenMenu?: () => void;
    onSelectVersion?: (index: number) => void;
    onCopy?: () => void;
    copyShortcutLabel?: string;
    downloadOptions?: ArtifactMenuFormatOption[];
    saveToDriveOptions?: ArtifactMenuFormatOption[];
    webpageViewMode?: WebpageViewMode;
    onWebpageViewModeChange?: (mode: WebpageViewMode) => void;
    // Manual (direct, non-AI) editing of the artifact's content — document artifacts only,
    // and only while viewing the latest version (see `canManuallyEdit` in ArtifactPanel).
    canManuallyEdit?: boolean;
    manualEditActive?: boolean;
    manualEditDirty?: boolean;
    manualEditMode?: ManualEditMode;
    onToggleManualEditMode?: () => void;
    onStartManualEdit?: () => void;
    onSaveManualEdit?: () => void;
    onCancelManualEdit?: () => void;
    layout: ArtifactPanelLayout;
    onBack?: () => void;
    onEnterFullscreen?: () => void;
    onExitFullscreen?: () => void;
}

export type ArtifactPanelLayout = 'docked' | 'mobile' | 'fullscreen';

const getArtifactHeaderTypeLabel = (type?: ArtifactType, language?: string): string | undefined => {
    if (type !== 'code') {
        return undefined;
    }

    return language ?? 'code';
};

const getCopyShortcutLabel = (): string => {
    return isMac() ? '⌘C' : 'Ctrl+C';
};

/** True when ⌘C/Ctrl+C should copy the whole artifact: nothing is selected and no field has focus. */
const isWholeArtifactCopyShortcut = (event: KeyboardEvent): boolean => {
    if (!(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey || event.key.toLowerCase() !== 'c') {
        return false;
    }
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, [contenteditable="true"]')) {
        return false;
    }
    const selection = window.getSelection();
    return !selection || selection.isCollapsed;
};

const PanelHeader = ({
    type,
    language,
    title,
    isStreaming,
    exportingDownload,
    exportHeaderStatusLabel,
    onClose,
    versionIndex,
    versions,
    onOpenMenu,
    onSelectVersion,
    onCopy,
    copyShortcutLabel,
    downloadOptions,
    saveToDriveOptions,
    webpageViewMode,
    onWebpageViewModeChange,
    canManuallyEdit,
    manualEditActive,
    manualEditDirty,
    manualEditMode,
    onToggleManualEditMode,
    onStartManualEdit,
    onSaveManualEdit,
    onCancelManualEdit,
    layout,
    onBack,
    onEnterFullscreen,
    onExitFullscreen,
}: PanelHeaderProps) => {
    const isMobileView = layout === 'mobile';
    const isFullscreen = layout === 'fullscreen';
    const typeLabel = getArtifactHeaderTypeLabel(type, language);
    const showWebpageViewToggle = !manualEditActive && type === 'webpage' && webpageViewMode && onWebpageViewModeChange;
    // The menu holds every action on the artifact, so it is a plain title while those can't run.
    const showTitleMenu =
        title &&
        !isStreaming &&
        !manualEditActive &&
        versions &&
        versions.length > 0 &&
        versionIndex !== undefined &&
        onOpenMenu &&
        onSelectVersion &&
        onCopy;

    const renderTitle = () => {
        if (!title) {
            return (
                <span className="flex-1 min-w-0 ml-1">
                    <span
                        className="rectangle-skeleton keep-motion rounded inline-block"
                        style={{ width: '8rem', height: '0.875rem' }}
                    />
                </span>
            );
        }
        if (showTitleMenu) {
            return (
                <div className="flex flex-row flex-nowrap min-w-0 flex-1">
                    <ArtifactTitleMenu
                        title={title}
                        typeLabel={typeLabel}
                        versions={versions}
                        selectedIndex={versionIndex}
                        onOpen={onOpenMenu}
                        onSelectVersion={onSelectVersion}
                        onCopy={onCopy}
                        copyShortcutLabel={copyShortcutLabel ?? getCopyShortcutLabel()}
                        downloadOptions={downloadOptions ?? []}
                        saveToDriveOptions={saveToDriveOptions ?? []}
                        onEdit={canManuallyEdit ? onStartManualEdit : undefined}
                        actionsDisabled={exportingDownload}
                    />
                </div>
            );
        }
        return (
            <span className="text-semibold text-ellipsis overflow-hidden whitespace-nowrap min-w-0 flex-1 color-norm ml-1">
                {title}
                {typeLabel && <span className="color-hint font-normal">{` · ${typeLabel}`}</span>}
            </span>
        );
    };

    return (
        <div className="shrink-0 flex flex-row flex-nowrap items-center gap-3 py-2 px-3 border-bottom border-weak bg-norm w-full min-w-0 overflow-hidden">
            <div className="flex flex-row flex-nowrap items-center gap-2 min-w-0 flex-1 overflow-hidden">
                {isFullscreen && (
                    <div className="artifact-fullscreen-brand shrink-0">
                        <img src={lumoCatIcon} alt={LUMO_SHORT_APP_NAME} className="artifact-fullscreen-avatar" />
                    </div>
                )}
                {onBack && (
                    <Button
                        icon
                        shape="ghost"
                        color="weak"
                        size="small"
                        onClick={onBack}
                        className="artifact-btn shrink-0"
                        title={
                            isMobileView
                                ? c('collider_2025:Action').t`Back to chat`
                                : c('collider_2025:Action').t`Back to all files`
                        }
                        aria-label={
                            isMobileView
                                ? c('collider_2025:Action').t`Back to chat`
                                : c('collider_2025:Action').t`Back to all files`
                        }
                    >
                        <LumoIcon name="ChevronLeft" size={16} />
                    </Button>
                )}
                {renderTitle()}
            </div>
            <div className="flex flex-row items-center gap-1 shrink-0">
                {exportingDownload && (
                    <Button
                        icon
                        shape="ghost"
                        color="weak"
                        size="small"
                        disabled
                        className="artifact-btn"
                        title={exportHeaderStatusLabel}
                        aria-label={exportHeaderStatusLabel}
                    >
                        <div className="artifact-export-spinner is-small" aria-hidden="true" />
                    </Button>
                )}
                {showWebpageViewToggle && (
                    <ArtifactViewModeToggle mode={webpageViewMode} onChange={onWebpageViewModeChange} />
                )}
                {!isStreaming && manualEditActive && (
                    <>
                        {onToggleManualEditMode && (
                            <Button
                                icon
                                shape="ghost"
                                color="weak"
                                size="small"
                                onClick={onToggleManualEditMode}
                                className="artifact-btn"
                                title={
                                    manualEditMode === 'source'
                                        ? c('collider_2025:Action').t`Edit as rich text`
                                        : c('collider_2025:Action').t`Edit as Markdown`
                                }
                                aria-label={
                                    manualEditMode === 'source'
                                        ? c('collider_2025:Action').t`Edit as rich text`
                                        : c('collider_2025:Action').t`Edit as Markdown`
                                }
                            >
                                <LumoIcon name={manualEditMode === 'source' ? 'Type' : 'FileCode'} size={16} />
                            </Button>
                        )}
                        <Button size="small" shape="ghost" color="weak" onClick={onCancelManualEdit}>
                            {c('collider_2025:Action').t`Cancel`}
                        </Button>
                        <Button
                            size="small"
                            shape="solid"
                            color="norm"
                            disabled={!manualEditDirty}
                            onClick={onSaveManualEdit}
                        >
                            <IcCheckmark size={4} className="mr-1" />
                            {c('collider_2025:Action').t`Save`}
                        </Button>
                    </>
                )}
                {!isMobileView && !isFullscreen && onEnterFullscreen && (
                    <Button
                        icon
                        shape="ghost"
                        color="weak"
                        size="small"
                        onClick={onEnterFullscreen}
                        className="artifact-btn"
                        title={c('collider_2025:Action').t`Full screen`}
                        aria-label={c('collider_2025:Action').t`Full screen`}
                    >
                        <LumoIcon name="Maximize2" size={16} />
                    </Button>
                )}
                {isFullscreen && onExitFullscreen && (
                    <Button
                        icon
                        shape="ghost"
                        color="weak"
                        size="small"
                        onClick={onExitFullscreen}
                        className="artifact-btn"
                        title={c('collider_2025:Action').t`Exit full screen`}
                        aria-label={c('collider_2025:Action').t`Exit full screen`}
                    >
                        <LumoIcon name="Minimize2" size={16} />
                    </Button>
                )}
                {!isMobileView && (
                    <Button
                        icon
                        shape="ghost"
                        color="weak"
                        size="small"
                        onClick={onClose}
                        className="artifact-btn"
                        title={c('collider_2025:Action').t`Close panel`}
                    >
                        <LumoIcon name="X" size={16} />
                    </Button>
                )}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Panel root
// ---------------------------------------------------------------------------

interface ArtifactPanelProps {
    isGenerating?: boolean;
    layout?: ArtifactPanelLayout;
    /** Desktop docked: return to the All files drawer (mutually exclusive with the panel). */
    onBackToFiles?: () => void;
}

const ArtifactPanel = ({ isGenerating = false, layout = 'docked', onBackToFiles }: ArtifactPanelProps) => {
    const isMobileView = layout === 'mobile';
    const isFullscreen = layout === 'fullscreen';
    useNativeComposerVisibilityApi({ hideComposer: isMobileView || isFullscreen });
    const {
        registry,
        selectedArtifact,
        selectedId,
        selectedVersionIndex,
        goToVersion,
        closePanel,
        enterFullscreen,
        exitFullscreen,
        isSelectedVersionProvisional,
        isLoadingPanelOpen,
        isArtifactRevisionLoading,
    } = useArtifactContext();
    const { createNotification } = useNotifications();
    const { setManualArtifactEditActive } = useArtifactPanelHostActions();
    const [webpageViewMode, setWebpageViewMode] = useState<WebpageViewMode>('preview');
    const [manualEditActive, setManualEditActive] = useState(false);
    const [draftContent, setDraftContent] = useState('');
    const [manualEditMode, setManualEditMode] = useState<ManualEditMode>('rich');
    // What the rich editor would save for an untouched document. Its serializer writes markdown in
    // its own style, so a draft equal to this is "no change" even though it differs from the original.
    const [normalizedOriginalContent, setNormalizedOriginalContent] = useState<string | null>(null);
    const richEditorRef = useRef<ArtifactRichTextEditorHandle>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const { handleSaveManualArtifactEdit } = useConversationActions();
    const isGuest = useIsGuest();
    const { artifactsView: isArtifactsViewFlagEnabled } = useLumoFlags();
    const versions = selectedId ? registry[selectedId]?.versions : undefined;
    const versionCount = versions?.length;
    // Everything that changes an artifact (Lumo, inline edits, manual edits) works on the latest
    // version, so an older version is shown read-only with a banner saying so.
    const isViewingOlderVersion = versionCount !== undefined && selectedVersionIndex < versionCount - 1;
    const {
        downloadOptions,
        saveToDriveOptions,
        exportingKind: exportingDownloadKind,
        exportFormatLabel: formatLabel,
        exportOverlayRef,
        saveToDriveModal,
    } = useArtifactFileActions({
        artifact: selectedArtifact ?? undefined,
        layout,
        viewedOlderVersion: isViewingOlderVersion,
        exportsDisabled: isGenerating || manualEditActive,
    });
    const headerRef = useRef<HTMLDivElement>(null);
    // Docked only: the fullscreen overlay stacks above spotlights, and the mobile layout has no room.
    // Waits for generation to finish so it never covers content that is still streaming in.
    const { shouldShowSpotlight, markSpotlightSeen, handleSpotlightDisplayed } = useArtifactPanelSpotlight(
        layout === 'docked' &&
            Boolean(selectedArtifact) &&
            !isGenerating &&
            !isSelectedVersionProvisional &&
            !manualEditActive &&
            exportingDownloadKind === null
    );

    // Reset to the live preview whenever the user switches to a different artifact (or version) —
    // a user manually inspecting the source of one webpage shouldn't land back on the source of
    // the next one they open.
    useEffect(() => {
        setWebpageViewMode('preview');
    }, [selectedArtifact?.id, selectedVersionIndex]);

    // ⌘C/Ctrl+C copies the whole artifact; the handler is rebuilt each render, so read it via a ref.
    const panelRootRef = useRef<HTMLDivElement>(null);
    const panelKeyDownRef = useRef<(event: KeyboardEvent) => void>(() => {});
    // The root that takes the listener only renders once an artifact is selected.
    const hasPanelRoot = Boolean(selectedArtifact);
    useEffect(() => {
        const root = panelRootRef.current;
        if (!root) {
            return;
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            panelKeyDownRef.current(event);
        };
        root.addEventListener('keydown', handleKeyDown);
        return () => {
            root.removeEventListener('keydown', handleKeyDown);
        };
    }, [hasPanelRoot]);

    useEffect(() => {
        setManualArtifactEditActive(manualEditActive);
        return () => {
            setManualArtifactEditActive(false);
        };
    }, [manualEditActive, setManualArtifactEditActive]);

    // Discard any in-progress manual edit when switching artifacts/versions, so a stale draft
    // never leaks onto a different artifact.
    useEffect(() => {
        setManualEditActive(false);
        setManualEditMode('rich');
        setDraftContent(normalizeDocumentCardFences(selectedArtifact?.content ?? ''));
    }, [selectedArtifact?.id, selectedVersionIndex]);

    const selectedContent = selectedArtifact?.content;
    useEffect(() => {
        setNormalizedOriginalContent(null);
        if (!manualEditActive || selectedContent === undefined) {
            return;
        }
        let cancelled = false;
        void loadNormalizeMarkdownForEditor()
            .then((normalize) => {
                return normalize(normalizeDocumentCardFences(selectedContent));
            })
            .then((normalized) => {
                if (!cancelled) {
                    setNormalizedOriginalContent(normalized);
                }
            })
            .catch(() => {
                // Without the baseline, only an exact match with the original counts as unchanged.
            });
        return () => {
            cancelled = true;
        };
    }, [manualEditActive, selectedContent]);

    if (!selectedArtifact && !isLoadingPanelOpen) {
        return null;
    }

    const panelBackAction = isMobileView ? closePanel : onBackToFiles;

    if (!selectedArtifact && isLoadingPanelOpen) {
        return (
            <div className="flex flex-column h-full min-h-0 min-w-0 overflow-hidden w-full bg-norm">
                <PanelHeader isStreaming onClose={closePanel} layout={layout} onBack={panelBackAction} />
                <ArtifactPanelLoading />
            </div>
        );
    }

    const artifact = selectedArtifact!;
    // Only latest-version document artifacts can be manually edited — editing an older version
    // would raise branch-fork semantics (overwrite vs. fork the conversation) that aren't solved yet.
    const canManuallyEdit =
        isArtifactsViewFlagEnabled &&
        artifact.type === 'document' &&
        !isGenerating &&
        !isSelectedVersionProvisional &&
        versionCount !== undefined &&
        selectedVersionIndex === versionCount - 1;
    // The editor starts from what the preview shows: leaked chat card fences already turned into a
    // table / quote (D12). Saving persists that form; opening and saving unchanged still is a no-op.
    const editableContent = normalizeDocumentCardFences(artifact.content);
    const isUnchangedDraft = (content: string) => {
        return content === artifact.content || content === editableContent || content === normalizedOriginalContent;
    };
    const manualEditDirty = !isUnchangedDraft(draftContent) && draftContent.trim().length > 0;
    const exportingDownload = exportingDownloadKind !== null;
    const exportHeaderStatusLabel = exportingDownload
        ? c('collider_2025: Info').t`Preparing ${formatLabel}…`
        : undefined;

    const getLatestDraft = () => {
        if (manualEditMode === 'rich' && richEditorRef.current) {
            return richEditorRef.current.getMarkdown();
        }
        return draftContent;
    };

    const handleStartManualEdit = () => {
        setDraftContent(editableContent);
        setManualEditMode('rich');
        setManualEditActive(true);
    };

    const handleCancelManualEdit = () => {
        setDraftContent(editableContent);
        setManualEditActive(false);
    };

    const handleSaveManualEdit = () => {
        // Read the editor directly: its change callback is debounced and may lag the last keystroke.
        const newContent = getLatestDraft();
        if (isUnchangedDraft(newContent) || newContent.trim().length === 0) {
            return;
        }
        handleSaveManualArtifactEdit({
            artifactId: artifact.id,
            artifactType: artifact.type,
            artifactTitle: artifact.title,
            newContent,
        });
        setManualEditActive(false);
    };

    const handleToggleManualEditMode = () => {
        // Carry the draft across: the source editor shows what rich text would save, and the rich
        // editor remounts from the (possibly hand-edited) markdown.
        setDraftContent(getLatestDraft());
        setManualEditMode((mode) => {
            return mode === 'rich' ? 'source' : 'rich';
        });
    };

    const handleRichEditorUnavailable = () => {
        setManualEditMode('source');
        createNotification({
            type: 'warning',
            text: c('collider_2025: Info')
                .t`Couldn't open the rich text editor, so you're editing the Markdown source.`,
        });
    };

    const handleCopy = () => {
        void navigator.clipboard.writeText(artifact.content).then(() => {
            sendArtifactContentCopiedEvent({
                artifactType: artifact.type,
                layout,
                viewedOlderVersion: isViewingOlderVersion,
            });
            createNotification({
                text: c('collider_2025:Notification').t`Copied to clipboard`,
            });
        });
    };

    const handleOpenVersionHistory = () => {
        sendArtifactVersionHistoryOpenedEvent({
            artifactType: artifact.type,
            layout,
            versionCount: versionCount ?? 1,
        });
    };

    const handleSelectVersion = (index: number, source: ArtifactVersionSelectSource) => {
        sendArtifactVersionSelectedEvent({
            artifactType: artifact.type,
            layout,
            source,
            versionsBehindLatest: (versionCount ?? 1) - 1 - index,
        });
        goToVersion(index);
    };

    const handleWebpageViewModeChange = (mode: WebpageViewMode) => {
        sendArtifactWebpageViewToggledEvent({
            mode,
            layout,
        });
        setWebpageViewMode(mode);
    };

    panelKeyDownRef.current = (event: KeyboardEvent) => {
        if (manualEditActive || isSelectedVersionProvisional || exportingDownload) {
            return;
        }
        if (isWholeArtifactCopyShortcut(event)) {
            event.preventDefault();
            handleCopy();
        }
    };

    return (
        // Focusable so ⌘C/Ctrl+C reaches the panel after clicking its content.
        <div
            className="flex flex-column h-full min-h-0 min-w-0 overflow-hidden w-full bg-norm outline-none"
            ref={panelRootRef}
            tabIndex={-1}
        >
            <ArtifactPanelSpotlight
                anchorRef={headerRef}
                show={shouldShowSpotlight}
                onClose={() => {
                    markSpotlightSeen();
                }}
                onDisplayed={handleSpotlightDisplayed}
                isGuest={isGuest}
            >
                <div ref={headerRef} className="shrink-0 w-full min-w-0">
                    <PanelHeader
                        type={artifact.type}
                        language={artifact.language}
                        title={artifact.title}
                        isStreaming={isSelectedVersionProvisional}
                        exportingDownload={exportingDownload}
                        exportHeaderStatusLabel={exportHeaderStatusLabel}
                        onClose={closePanel}
                        layout={layout}
                        onBack={panelBackAction}
                        onEnterFullscreen={layout === 'docked' ? enterFullscreen : undefined}
                        onExitFullscreen={isFullscreen ? exitFullscreen : undefined}
                        versionIndex={selectedVersionIndex}
                        versions={versions}
                        onOpenMenu={handleOpenVersionHistory}
                        onSelectVersion={(index) => {
                            handleSelectVersion(index, 'history');
                        }}
                        onCopy={handleCopy}
                        downloadOptions={downloadOptions}
                        saveToDriveOptions={saveToDriveOptions}
                        webpageViewMode={webpageViewMode}
                        onWebpageViewModeChange={handleWebpageViewModeChange}
                        canManuallyEdit={canManuallyEdit}
                        manualEditActive={manualEditActive}
                        manualEditDirty={manualEditDirty}
                        manualEditMode={manualEditMode}
                        onToggleManualEditMode={handleToggleManualEditMode}
                        onStartManualEdit={handleStartManualEdit}
                        onSaveManualEdit={handleSaveManualEdit}
                        onCancelManualEdit={handleCancelManualEdit}
                    />
                </div>
            </ArtifactPanelSpotlight>
            {isViewingOlderVersion && !manualEditActive && versions && (
                <ArtifactOlderVersionBanner
                    version={versions[selectedVersionIndex]}
                    versionNumber={selectedVersionIndex + 1}
                    versionCount={versions.length}
                    onViewLatest={() => {
                        handleSelectVersion(versions.length - 1, 'banner');
                    }}
                />
            )}
            <div
                ref={contentRef}
                className="artifact-content-area relative flex flex-column flex-1 min-h-0 min-w-0 overflow-hidden w-full"
            >
                {manualEditActive && manualEditMode === 'rich' ? (
                    <ArtifactPreviewErrorBoundary
                        content={draftContent}
                        resetKey={`${artifact.id}-${selectedVersionIndex}`}
                        onError={handleRichEditorUnavailable}
                    >
                        <Suspense fallback={<ArtifactPanelLoading />}>
                            <ArtifactRichTextEditor
                                key={`manual-edit-${artifact.id}-${selectedVersionIndex}`}
                                ref={richEditorRef}
                                initialMarkdown={draftContent}
                                onChange={setDraftContent}
                                onUnavailable={handleRichEditorUnavailable}
                            />
                        </Suspense>
                    </ArtifactPreviewErrorBoundary>
                ) : manualEditActive ? (
                    <TextareaAutosize
                        value={draftContent}
                        onChange={(e) => {
                            setDraftContent(e.target.value);
                        }}
                        className="artifact-manual-edit-textarea flex-1 min-h-0 text-sm color-norm bg-norm border-none outline-none--at-all resize-none p-4 overflow-auto"
                        autoFocus
                    />
                ) : exportingDownload ? (
                    <ArtifactExportOverlay ref={exportOverlayRef} formatLabel={formatLabel} />
                ) : (
                    <div className="relative flex flex-column flex-1 min-h-0 min-w-0 overflow-hidden w-full">
                        <ArtifactContent
                            artifact={artifact}
                            showLineNumbers={false}
                            webpageViewMode={webpageViewMode}
                            resetKey={`${artifact.id}-${selectedVersionIndex}-${webpageViewMode}`}
                        />
                        {isArtifactRevisionLoading && <ArtifactPanelRevisionOverlay artifactType={artifact.type} />}
                        {/* Hidden on older versions: the selection would come from this version while the
                            model revises the latest, where that text may no longer exist. */}
                        {isArtifactsViewFlagEnabled && !isViewingOlderVersion && (
                            <ArtifactInlineEdit
                                containerRef={contentRef}
                                artifactId={artifact.id}
                                title={artifact.title}
                                artifactType={artifact.type}
                                isGenerating={isGenerating || isSelectedVersionProvisional}
                                layout={layout}
                            />
                        )}
                    </div>
                )}
            </div>
            {saveToDriveModal}
        </div>
    );
};

export default ArtifactPanel;
