import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { IcArrowDownToSquare } from '@proton/icons/icons/IcArrowDownToSquare';
import { IcBrandProtonDriveFilled } from '@proton/icons/icons/IcBrandProtonDriveFilled';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcPencil } from '@proton/icons/icons/IcPencil';
import { IcSquares } from '@proton/icons/icons/IcSquares';

import { useConversationActions } from '../../../providers/ConversationActionsProvider';
import { useIsGuest } from '../../../providers/IsGuestProvider';
import DropdownMenu from '../../DropdownMenu';
import { useArtifactContext } from './ArtifactContext';
import { ArtifactInlineEdit } from './ArtifactInlineEdit';
import SaveArtifactToDriveModal from './SaveArtifactToDriveModal';
import type { ArtifactRegistry } from './artifactRegistry';
import { CodeRenderer } from './artifactRenderers';
import { ARTIFACT_TYPE_CONFIG } from './artifactTypeConfig';
import type { ArtifactType, ParsedArtifact } from './parseArtifacts';

import './ArtifactPanel.scss';

// ---------------------------------------------------------------------------
// Content — dispatches to the type's registered renderer
// ---------------------------------------------------------------------------

export type WebpageViewMode = 'preview' | 'code';

interface ArtifactContentProps {
    artifact: ParsedArtifact;
    showLineNumbers: boolean;
    // Only meaningful for 'webpage' artifacts — lets the user inspect the generated source
    // instead of the live sandboxed render. Ignored for code/document, which have only one view.
    webpageViewMode?: WebpageViewMode;
}

const ArtifactContent = ({ artifact, showLineNumbers, webpageViewMode }: ArtifactContentProps) => {
    try {
        if (artifact.type === 'webpage' && webpageViewMode === 'code') {
            return <CodeRenderer artifact={{ ...artifact, language: 'html' }} showLineNumbers={showLineNumbers} />;
        }
        const { Renderer } = ARTIFACT_TYPE_CONFIG[artifact.type];
        return <Renderer artifact={artifact} showLineNumbers={showLineNumbers} />;
    } catch {
        return (
            <div className="artifact-fallback p-4 flex-1 overflow-auto">
                <p className="text-xs color-warning mb-2">{c('collider_2025:Warning').t`Preview unavailable`}</p>
                <pre className="text-monospace text-sm m-0 overflow-auto color-norm whitespace-pre-wrap">
                    {artifact.content}
                </pre>
            </div>
        );
    }
};

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
    showLineNumbers?: boolean;
    onToggleLineNumbers?: () => void;
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
}

const getVersionLabel = (versionNumber: number, totalVersions: number) => {
    return c('collider_2025:Info').t`v${versionNumber} of ${totalVersions}`;
};

const PanelHeader = ({
    type,
    language,
    title,
    isStreaming,
    // showLineNumbers,
    // onToggleLineNumbers,
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
}: PanelHeaderProps) => (
    <div className="artifact-panel-header flex flex-row items-center gap-2 px-3 py-2 border-bottom border-weak shrink-0 w-full">
        {type ? (
            <span className="artifact-type-badge flex flex-row items-center gap-1 shrink-0 bg-strong">
                {(() => {
                    const { icon: Icon, badgeLabel } = ARTIFACT_TYPE_CONFIG[type];
                    return (
                        <>
                            <Icon size={3} />
                            <span className="text-xs font-bold">{badgeLabel}</span>
                        </>
                    );
                })()}
            </span>
        ) : (
            // Type not yet known (partial open tag)
            <span className="artifact-type-badge shrink-0">
                <div
                    className="rectangle-skeleton keep-motion rounded"
                    style={{ width: '2.5rem', height: '0.75rem' }}
                />
            </span>
        )}
        {type === 'code' && language && <span className="text-xs color-hint shrink-0">{language}</span>}
        {type === 'webpage' && webpageViewMode === 'code' && <span className="text-xs color-hint shrink-0">html</span>}
        <span className="flex-1 text-sm font-medium text-ellipsis overflow-hidden whitespace-nowrap color-norm">
            {title ?? (
                <span
                    className="rectangle-skeleton keep-motion rounded inline-block"
                    style={{ width: '8rem', height: '0.875rem' }}
                />
            )}
        </span>
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
        <div className="flex flex-row items-center gap-1 shrink-0">
            {/* {!isStreaming && type === 'code' && (
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    onClick={onToggleLineNumbers}
                    className={`artifact-btn text-xs ${showLineNumbers ? 'color-primary' : 'color-hint'}`}
                    title={c('collider_2025:Action').t`Toggle line numbers`}
                >
                    {c('collider_2025:Action').t`1:1`}
                </Button>
            )} */}
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
            {!isStreaming && !manualEditActive && type === 'webpage' && webpageViewMode && onWebpageViewModeChange && (
                <div className="artifact-view-toggle flex flex-row items-center rounded-full bg-weak p-0.5 shrink-0">
                    <Button
                        shape={webpageViewMode === 'code' ? 'solid' : 'ghost'}
                        color={webpageViewMode === 'code' ? 'norm' : 'weak'}
                        size="small"
                        pill
                        className="artifact-view-toggle-btn"
                        onClick={() => onWebpageViewModeChange('code')}
                    >
                        {c('collider_2025:Action').t`Code`}
                    </Button>
                    <Button
                        shape={webpageViewMode === 'preview' ? 'solid' : 'ghost'}
                        color={webpageViewMode === 'preview' ? 'norm' : 'weak'}
                        size="small"
                        pill
                        className="artifact-view-toggle-btn"
                        onClick={() => onWebpageViewModeChange('preview')}
                    >
                        {c('collider_2025:Action').t`Preview`}
                    </Button>
                </div>
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
        </div>
    </div>
);

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
}

const ArtifactPanel = ({ isGenerating = false }: ArtifactPanelProps) => {
    const {
        registry,
        selectedArtifact,
        selectedId,
        selectedVersionIndex,
        openArtifact,
        goToVersion,
        hasUnseenRevision,
        closePanel,
        isSelectedVersionProvisional,
    } = useArtifactContext();
    const [showLineNumbers, setShowLineNumbers] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [webpageViewMode, setWebpageViewMode] = useState<WebpageViewMode>('preview');
    const [manualEditActive, setManualEditActive] = useState(false);
    const [draftContent, setDraftContent] = useState('');
    const contentRef = useRef<HTMLDivElement>(null);
    const { handleSaveManualArtifactEdit } = useConversationActions();
    const isGuest = useIsGuest();
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
        <div className="artifact-panel flex flex-column h-full overflow-hidden w-full rounded-xl mb-6">
            <PanelHeader
                type={artifact.type}
                language={artifact.language}
                title={artifact.title}
                isStreaming={false}
                showLineNumbers={showLineNumbers}
                onToggleLineNumbers={() => {
                    setShowLineNumbers((v) => !v);
                }}
                onCopy={handleCopy}
                copySuccess={copySuccess}
                onDownload={handleDownload}
                onClose={closePanel}
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
                className="artifact-content-area relative flex flex-column flex-1 overflow-hidden w-full"
            >
                {manualEditActive ? (
                    <TextareaAutosize
                        value={draftContent}
                        onChange={(e) => {
                            setDraftContent(e.target.value);
                        }}
                        className="artifact-manual-edit-textarea flex-1 text-sm color-norm bg-norm border-none outline-none--at-all resize-none p-4"
                        autoFocus
                    />
                ) : (
                    <>
                        <ArtifactContent
                            artifact={artifact}
                            showLineNumbers={showLineNumbers}
                            webpageViewMode={webpageViewMode}
                        />
                        <ArtifactInlineEdit
                            containerRef={contentRef}
                            artifactId={artifact.id}
                            title={artifact.title}
                            artifactType={artifact.type}
                            isGenerating={isGenerating || isSelectedVersionProvisional}
                        />
                    </>
                )}
            </div>
            {canSaveToDrive && renderSaveToDriveModal && (
                <SaveArtifactToDriveModal {...saveToDriveModal} artifact={artifact} />
            )}
        </div>
    );
};

export default ArtifactPanel;
