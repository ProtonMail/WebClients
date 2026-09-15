import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { IcArrowDownToSquare } from '@proton/icons/icons/IcArrowDownToSquare';
import { IcBrandProtonDriveFilled } from '@proton/icons/icons/IcBrandProtonDriveFilled';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcPencil } from '@proton/icons/icons/IcPencil';
import { IcSquares } from '@proton/icons/icons/IcSquares';

import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useConversationActions } from '../../../providers/ConversationActionsProvider';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useNativeComposerVisibilityApi } from '../../Composer/hooks/useNativeComposerVisibilityApi';
import { LumoIcon } from '../../LumoIcon/LumoIcon';
import DropdownMenu from '../../DropdownMenu';
import { ArtifactContent } from './ArtifactContent';
import type { WebpageViewMode } from './ArtifactContent';
import { useArtifactContext } from './ArtifactContext';
import { ArtifactViewModeToggle } from './ArtifactViewModeToggle';
import { ArtifactInlineEdit } from './ArtifactInlineEdit';
import SaveArtifactToDriveModal from './SaveArtifactToDriveModal';
import type { ArtifactRegistry } from './artifactRegistry';
import { ARTIFACT_TYPE_CONFIG } from './artifactTypeConfig';
import type { ArtifactType } from './parseArtifacts';

import './ArtifactPanel.scss';

// ---------------------------------------------------------------------------
// Shared panel header
// ---------------------------------------------------------------------------

interface ArtifactSwitcherEntry {
    id: string;
    title: string;
    type: ArtifactType;
    hasUnseenRevision: boolean;
}

interface PanelHeaderProps {
    type?: ArtifactType;
    language?: string;
    title?: string;
    isStreaming: boolean;
    onCopy?: () => void;
    copySuccess?: boolean;
    onDownload?: () => void;
    onClose: () => void;
    versionIndex?: number;
    versionCount?: number;
    onPrevVersion?: () => void;
    onNextVersion?: () => void;
    switcherEntries?: ArtifactSwitcherEntry[];
    onSelectArtifact?: (id: string) => void;
    webpageViewMode?: WebpageViewMode;
    onWebpageViewModeChange?: (mode: WebpageViewMode) => void;
    // Manual (direct, non-AI) editing of the artifact's content — document artifacts only,
    // and only while viewing the latest version (see `canManuallyEdit` in ArtifactPanel).
    canManuallyEdit?: boolean;
    manualEditActive?: boolean;
    manualEditDirty?: boolean;
    onStartManualEdit?: () => void;
    onSaveManualEdit?: () => void;
    onCancelManualEdit?: () => void;
    // Save-to-Drive — document artifacts only (see `canSaveToDrive` in ArtifactPanel).
    canSaveToDrive?: boolean;
    onSaveToDrive?: () => void;
    layout: ArtifactPanelLayout;
    onBack?: () => void;
    onEnterFullscreen?: () => void;
    onExitFullscreen?: () => void;
}

export type ArtifactPanelLayout = 'docked' | 'mobile' | 'fullscreen';

const getVersionLabel = (versionNumber: number, totalVersions: number) => {
    return c('collider_2025:Info').t`v${versionNumber} of ${totalVersions}`;
};

const getArtifactHeaderTypeLabel = (type?: ArtifactType, language?: string): string | undefined => {
    if (!type) {
        return undefined;
    }
    if (type === 'webpage') {
        return 'HTML';
    }
    if (type === 'code') {
        return language ?? 'code';
    }
    if (type === 'presentation') {
        return c('collider_2025:Info').t`Slides`;
    }
    return ARTIFACT_TYPE_CONFIG[type].badgeLabel;
};

const PanelHeader = ({
    type,
    language,
    title,
    isStreaming,
    onCopy,
    copySuccess,
    onDownload,
    onClose,
    versionIndex,
    versionCount,
    onPrevVersion,
    onNextVersion,
    switcherEntries,
    onSelectArtifact,
    webpageViewMode,
    onWebpageViewModeChange,
    canManuallyEdit,
    manualEditActive,
    manualEditDirty,
    onStartManualEdit,
    onSaveManualEdit,
    onCancelManualEdit,
    canSaveToDrive,
    onSaveToDrive,
    layout,
    onBack,
    onEnterFullscreen,
    onExitFullscreen,
}: PanelHeaderProps) => {
    const isMobileView = layout === 'mobile';
    const isFullscreen = layout === 'fullscreen';
    const typeLabel = getArtifactHeaderTypeLabel(type, language);
    const showWebpageViewToggle =
        !manualEditActive && type === 'webpage' && webpageViewMode && onWebpageViewModeChange;

    return (
        <div className="shrink-0 flex flex-row flex-nowrap items-center gap-3 py-2 px-3 border-bottom border-weak bg-norm w-full min-w-0 overflow-hidden">
            <div className="flex flex-row items-center gap-2 min-w-0 flex-1 overflow-hidden">
                {isFullscreen && (
                    <div className="artifact-fullscreen-brand shrink-0">
                        <img
                            src={lumoCatIcon}
                            alt={LUMO_SHORT_APP_NAME}
                            className="artifact-fullscreen-avatar"
                        />
                    </div>
                )}
                {isMobileView && onBack && (
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        onClick={onBack}
                        className="artifact-btn shrink-0"
                        title={c('collider_2025:Action').t`Back to chat`}
                        aria-label={c('collider_2025:Action').t`Back to chat`}
                    >
                        <IcChevronLeft size={4} className="color-hint" />
                    </Button>
                )}
                {showWebpageViewToggle && (
                    <ArtifactViewModeToggle mode={webpageViewMode} onChange={onWebpageViewModeChange} />
                )}
                {type && type !== 'webpage' ? (
                    <span className="inline-flex items-center gap-1 shrink-0 bg-strong color-weak text-xs text-semibold rounded-sm px-1.5 py-0.5 text-nowrap">
                        {(() => {
                            const { icon: Icon, badgeLabel } = ARTIFACT_TYPE_CONFIG[type];
                            return (
                                <>
                                    <Icon size={3} />
                                    <span>{badgeLabel}</span>
                                </>
                            );
                        })()}
                    </span>
                ) : !type ? (
                    <span className="inline-flex shrink-0 bg-strong rounded-sm px-1.5 py-0.5">
                        <div
                            className="rectangle-skeleton keep-motion rounded"
                            style={{ width: '2.5rem', height: '0.75rem' }}
                        />
                    </span>
                ) : null}
                <span className="text-sm text-semibold text-ellipsis overflow-hidden whitespace-nowrap min-w-0 flex-1 color-norm">
                    {title ?? (
                        <span
                            className="rectangle-skeleton keep-motion rounded inline-block"
                            style={{ width: '8rem', height: '0.875rem' }}
                        />
                    )}
                    {title && typeLabel && (
                        <span className="color-hint font-normal">{` · ${typeLabel}`}</span>
                    )}
                </span>
            </div>
            <div className="flex flex-row items-center gap-1 shrink-0">
                {!isStreaming &&
                    !manualEditActive &&
                    versionCount !== undefined &&
                    versionCount > 1 &&
                    versionIndex !== undefined && (
                        <div className="flex flex-row items-center gap-1 shrink-0">
                            <Button
                                icon
                                shape="ghost"
                                size="small"
                                onClick={onPrevVersion}
                                disabled={versionIndex === 0}
                                className="artifact-btn"
                                title={c('collider_2025:Action').t`Previous version`}
                            >
                                <IcChevronLeft size={4} className="color-hint" />
                            </Button>
                            <span className="text-xs color-hint shrink-0 text-nowrap">
                                {getVersionLabel(versionIndex + 1, versionCount)}
                            </span>
                            <Button
                                icon
                                shape="ghost"
                                size="small"
                                onClick={onNextVersion}
                                disabled={versionIndex === versionCount - 1}
                                className="artifact-btn"
                                title={c('collider_2025:Action').t`Next version`}
                            >
                                <IcChevronRight size={4} className="color-hint" />
                            </Button>
                        </div>
                    )}
                {!isStreaming && !manualEditActive && switcherEntries && switcherEntries.length > 1 && onSelectArtifact && (
                    <DropdownMenu
                        onToggle={() => {}}
                        visibleOnHover={false}
                        options={switcherEntries.map((entry) => ({
                            label: entry.title,
                            value: entry.id,
                            icon: (
                                <span className="relative flex">
                                    {(() => {
                                        const EntryIcon = ARTIFACT_TYPE_CONFIG[entry.type].icon;
                                        return <EntryIcon size={4} />;
                                    })()}
                                    {entry.hasUnseenRevision && (
                                        <span className="artifact-unseen-dot absolute rounded-full bg-danger" />
                                    )}
                                </span>
                            ),
                            onClick: () => {
                                onSelectArtifact(entry.id);
                            },
                        }))}
                    />
                )}
                {!isStreaming && !manualEditActive && (
                <>
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        onClick={onCopy}
                        className="artifact-btn"
                        title={c('collider_2025:Action').t`Copy content`}
                    >
                        {copySuccess ? (
                            <span className="text-xs color-success">{c('collider_2025:Info').t`Copied`}</span>
                        ) : (
                            <IcSquares size={4} className="color-hint" />
                        )}
                    </Button>
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        onClick={onDownload}
                        className="artifact-btn"
                        title={c('collider_2025:Action').t`Download`}
                    >
                        <IcArrowDownToSquare size={4} className="color-hint" />
                    </Button>
                    {canSaveToDrive && onSaveToDrive && (
                        <Button
                            icon
                            shape="ghost"
                            size="small"
                            onClick={onSaveToDrive}
                            className="artifact-btn"
                            title={c('collider_2025:Action').t`Save to Drive`}
                        >
                            <IcBrandProtonDriveFilled size={4} className="color-hint" />
                        </Button>
                    )}
                    {canManuallyEdit && onStartManualEdit && (
                        <Button
                            icon
                            shape="ghost"
                            size="small"
                            onClick={onStartManualEdit}
                            className="artifact-btn"
                            title={c('collider_2025:Action').t`Edit`}
                        >
                            <IcPencil size={4} className="color-hint" />
                        </Button>
                    )}
                </>
            )}
            {!isStreaming && manualEditActive && (
                <>
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
                        size="small"
                        onClick={onEnterFullscreen}
                        className="artifact-btn"
                        title={c('collider_2025:Action').t`Full screen`}
                        aria-label={c('collider_2025:Action').t`Full screen`}
                    >
                        <LumoIcon name="Maximize2" size={16} className="color-hint" />
                    </Button>
                )}
                {isFullscreen && onExitFullscreen && (
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        onClick={onExitFullscreen}
                        className="artifact-btn"
                        title={c('collider_2025:Action').t`Exit full screen`}
                        aria-label={c('collider_2025:Action').t`Exit full screen`}
                    >
                        <LumoIcon name="Minimize2" size={16} className="color-hint" />
                    </Button>
                )}
                {!isMobileView && (
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        onClick={onClose}
                        className="artifact-btn"
                        title={c('collider_2025:Action').t`Close panel`}
                    >
                        <IcCross size={4} className="color-hint" />
                    </Button>
                )}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Panel root
// ---------------------------------------------------------------------------

function buildSwitcherEntries(
    registry: ArtifactRegistry,
    hasUnseenRevision: (id: string) => boolean
): ArtifactSwitcherEntry[] {
    return Object.values(registry)
        .sort((a, b) => {
            const aLatest = a.versions[a.versions.length - 1]?.createdAt ?? '';
            const bLatest = b.versions[b.versions.length - 1]?.createdAt ?? '';
            return bLatest.localeCompare(aLatest);
        })
        .map((entry) => ({
            id: entry.id,
            title: entry.title,
            type: entry.type,
            hasUnseenRevision: hasUnseenRevision(entry.id),
        }));
}

interface ArtifactPanelProps {
    isGenerating?: boolean;
    layout?: ArtifactPanelLayout;
}

const ArtifactPanel = ({ isGenerating = false, layout = 'docked' }: ArtifactPanelProps) => {
    const isMobileView = layout === 'mobile';
    const isFullscreen = layout === 'fullscreen';
    useNativeComposerVisibilityApi({ hideComposer: isMobileView || isFullscreen });
    const {
        registry,
        selectedArtifact,
        selectedId,
        selectedVersionIndex,
        openArtifact,
        goToVersion,
        hasUnseenRevision,
        closePanel,
        enterFullscreen,
        exitFullscreen,
        isSelectedVersionProvisional,
    } = useArtifactContext();
    const [copySuccess, setCopySuccess] = useState(false);
    const [webpageViewMode, setWebpageViewMode] = useState<WebpageViewMode>('preview');
    const [manualEditActive, setManualEditActive] = useState(false);
    const [draftContent, setDraftContent] = useState('');
    const contentRef = useRef<HTMLDivElement>(null);
    const { handleSaveManualArtifactEdit } = useConversationActions();
    const isGuest = useIsGuest();
    const { artifactsView: isArtifactsViewFlagEnabled } = useLumoFlags();
    const [saveToDriveModal, setSaveToDriveModal, renderSaveToDriveModal] = useModalState();

    // Reset to the live preview whenever the user switches to a different artifact (or version) —
    // a user manually inspecting the source of one webpage shouldn't land back on the source of
    // the next one they open.
    useEffect(() => {
        setWebpageViewMode('preview');
    }, [selectedArtifact?.id, selectedVersionIndex]);

    // Discard any in-progress manual edit when switching artifacts/versions, so a stale draft
    // never leaks onto a different artifact.
    useEffect(() => {
        setManualEditActive(false);
        setDraftContent(selectedArtifact?.content ?? '');
    }, [selectedArtifact?.id, selectedVersionIndex]);

    if (!selectedArtifact) {
        return null;
    }

    const artifact = selectedArtifact;
    const versionCount = selectedId ? registry[selectedId]?.versions.length : undefined;
    const switcherEntries = buildSwitcherEntries(registry, hasUnseenRevision);
    // Only latest-version document artifacts can be manually edited — editing an older version
    // would raise branch-fork semantics (overwrite vs. fork the conversation) that aren't solved yet.
    const canManuallyEdit =
        isArtifactsViewFlagEnabled &&
        artifact.type === 'document' &&
        !isGenerating &&
        !isSelectedVersionProvisional &&
        versionCount !== undefined &&
        selectedVersionIndex === versionCount - 1;
    const manualEditDirty = draftContent !== artifact.content && draftContent.trim().length > 0;
    const canSaveToDrive = artifact.type === 'document' && !isGuest;

    const handleStartManualEdit = () => {
        setDraftContent(artifact.content);
        setManualEditActive(true);
    };

    const handleCancelManualEdit = () => {
        setDraftContent(artifact.content);
        setManualEditActive(false);
    };

    const handleSaveManualEdit = () => {
        if (!manualEditDirty) {
            return;
        }
        handleSaveManualArtifactEdit({
            artifactId: artifact.id,
            artifactType: artifact.type,
            artifactTitle: artifact.title,
            newContent: draftContent,
        });
        setManualEditActive(false);
    };

    const handleCopy = () => {
        void navigator.clipboard.writeText(artifact.content).then(() => {
            setCopySuccess(true);
            setTimeout(() => {
                setCopySuccess(false);
            }, 1500);
        });
    };

    const handleDownload = () => {
        const ext = ARTIFACT_TYPE_CONFIG[artifact.type].downloadExt(artifact);
        const filename = `${artifact.title.toLowerCase().replace(/\s+/g, '-')}.${ext}`;
        const blob = new Blob([artifact.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-column h-full min-h-0 min-w-0 overflow-hidden w-full bg-norm">
            <PanelHeader
                type={artifact.type}
                language={artifact.language}
                title={artifact.title}
                isStreaming={false}
                onCopy={handleCopy}
                copySuccess={copySuccess}
                onDownload={handleDownload}
                onClose={closePanel}
                layout={layout}
                onBack={isMobileView ? closePanel : undefined}
                onEnterFullscreen={layout === 'docked' ? enterFullscreen : undefined}
                onExitFullscreen={isFullscreen ? exitFullscreen : undefined}
                versionIndex={selectedVersionIndex}
                versionCount={versionCount}
                onPrevVersion={() => {
                    goToVersion(selectedVersionIndex - 1);
                }}
                onNextVersion={() => {
                    goToVersion(selectedVersionIndex + 1);
                }}
                switcherEntries={switcherEntries}
                onSelectArtifact={openArtifact}
                webpageViewMode={webpageViewMode}
                onWebpageViewModeChange={setWebpageViewMode}
                canManuallyEdit={canManuallyEdit}
                manualEditActive={manualEditActive}
                manualEditDirty={manualEditDirty}
                onStartManualEdit={handleStartManualEdit}
                onSaveManualEdit={handleSaveManualEdit}
                onCancelManualEdit={handleCancelManualEdit}
                canSaveToDrive={canSaveToDrive}
                onSaveToDrive={() => setSaveToDriveModal(true)}
            />
            <div
                ref={contentRef}
                className="artifact-content-area relative flex flex-column flex-1 min-h-0 min-w-0 overflow-hidden w-full"
            >
                {manualEditActive ? (
                    <TextareaAutosize
                        value={draftContent}
                        onChange={(e) => {
                            setDraftContent(e.target.value);
                        }}
                        className="artifact-manual-edit-textarea flex-1 min-h-0 text-sm color-norm bg-norm border-none outline-none--at-all resize-none p-4 overflow-auto"
                        autoFocus
                    />
                ) : (
                    <div className="relative flex flex-column flex-1 min-h-0 min-w-0 overflow-hidden w-full">
                        <ArtifactContent
                            artifact={artifact}
                            showLineNumbers={false}
                            webpageViewMode={webpageViewMode}
                            resetKey={`${artifact.id}-${selectedVersionIndex}-${webpageViewMode}`}
                        />
                        {isArtifactsViewFlagEnabled && (
                            <ArtifactInlineEdit
                                containerRef={contentRef}
                                artifactId={artifact.id}
                                title={artifact.title}
                                artifactType={artifact.type}
                                isGenerating={isGenerating || isSelectedVersionProvisional}
                            />
                        )}
                    </div>
                )}
            </div>
            {canSaveToDrive && renderSaveToDriveModal && (
                <SaveArtifactToDriveModal {...saveToDriveModal} artifact={artifact} />
            )}
        </div>
    );
};

export default ArtifactPanel;
