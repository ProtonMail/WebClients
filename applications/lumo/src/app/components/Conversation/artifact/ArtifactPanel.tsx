import { Suspense, lazy, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowDownToSquare } from '@proton/icons/icons/IcArrowDownToSquare';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcCode } from '@proton/icons/icons/IcCode';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';
import { IcSquares } from '@proton/icons/icons/IcSquares';

import { useLumoTheme } from '../../../providers';
import DropdownMenu from '../../DropdownMenu';
import { useArtifactContext } from './ArtifactContext';
import { ArtifactInlineEdit } from './ArtifactInlineEdit';
import type { ArtifactRegistry } from './artifactRegistry';
import type { ParsedArtifact } from './parseArtifacts';
import { getFileExtension } from './parseArtifacts';

import './ArtifactPanel.scss';

// Lazy-load the syntax highlighter to keep the initial bundle small
const LumoMarkdownCodeBlockHighlighter = lazy(() => import('../../LumoMarkdown/LumoMarkdownCodeBlockHighlighter'));

// Lazy-load react-markdown for document rendering
const MarkdownRenderer = lazy(() =>
    import('react-markdown').then((mod) => ({
        default: (props: { children: string }) => {
            const Markdown = mod.default;
            return <Markdown>{props.children}</Markdown>;
        },
    }))
);

// ---------------------------------------------------------------------------
// Full renderers — used once generation is complete
// ---------------------------------------------------------------------------

interface CodeRendererProps {
    artifact: ParsedArtifact;
    showLineNumbers: boolean;
}

const CodeRenderer = ({ artifact, showLineNumbers }: CodeRendererProps) => {
    const { theme } = useLumoTheme();

    if (!artifact.content) {
        return <p className="color-hint text-sm p-4">{c('collider_2025:Info').t`No content generated`}</p>;
    }

    return (
        <div className="artifact-code-content overflow-auto flex-1 w-full">
            <Suspense
                fallback={
                    <pre className="text-monospace text-sm m-0 p-4 overflow-auto color-norm">{artifact.content}</pre>
                }
            >
                <div className={showLineNumbers ? 'artifact-code--line-numbers' : undefined}>
                    <LumoMarkdownCodeBlockHighlighter
                        code={artifact.content}
                        language={artifact.language ?? 'text'}
                        theme={theme}
                    />
                </div>
            </Suspense>
        </div>
    );
};

interface DocumentRendererProps {
    artifact: ParsedArtifact;
}

const DocumentRenderer = ({ artifact }: DocumentRendererProps) => {
    if (!artifact.content) {
        return <p className="color-hint text-sm p-4">{c('collider_2025:Info').t`No content generated`}</p>;
    }

    return (
        <div className="artifact-document-content overflow-auto flex-1 p-4">
            <Suspense
                fallback={
                    <pre className="text-monospace text-sm m-0 overflow-auto color-norm whitespace-pre-wrap">
                        {artifact.content}
                    </pre>
                }
            >
                <div className="artifact-markdown prose">
                    <MarkdownRenderer>{artifact.content}</MarkdownRenderer>
                </div>
            </Suspense>
        </div>
    );
};

interface ArtifactContentProps {
    artifact: ParsedArtifact;
    showLineNumbers: boolean;
}

const ArtifactContent = ({ artifact, showLineNumbers }: ArtifactContentProps) => {
    try {
        if (artifact.type === 'code') {
            return <CodeRenderer artifact={artifact} showLineNumbers={showLineNumbers} />;
        }
        return <DocumentRenderer artifact={artifact} />;
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
    type: 'code' | 'document';
    hasUnseenRevision: boolean;
}

interface PanelHeaderProps {
    type?: 'code' | 'document';
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
}

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
}: PanelHeaderProps) => (
    <div className="artifact-panel-header flex flex-row items-center gap-2 px-3 py-2 border-bottom border-weak shrink-0 w-full">
        {type ? (
            <span className="artifact-type-badge flex flex-row items-center gap-1 shrink-0 bg-strong">
                {type === 'code' ? <IcCode size={3} /> : <IcFileLines size={3} />}
                <span className="text-xs font-bold">{type === 'code' ? 'CODE' : 'DOC'}</span>
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
        <span className="flex-1 text-sm font-medium text-ellipsis overflow-hidden whitespace-nowrap color-norm">
            {title ?? (
                <span
                    className="rectangle-skeleton keep-motion rounded inline-block"
                    style={{ width: '8rem', height: '0.875rem' }}
                />
            )}
        </span>
        {!isStreaming && versionCount !== undefined && versionCount > 1 && versionIndex !== undefined && (
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
                    {c('collider_2025:Info').t`v${versionIndex + 1} of ${versionCount}`}
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
            {!isStreaming && switcherEntries && switcherEntries.length > 1 && onSelectArtifact && (
                <DropdownMenu
                    onToggle={() => {}}
                    visibleOnHover={false}
                    options={switcherEntries.map((entry) => ({
                        label: entry.title,
                        value: entry.id,
                        icon: (
                            <span className="relative flex">
                                {entry.type === 'code' ? <IcCode size={4} /> : <IcFileLines size={4} />}
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
            {!isStreaming && (
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
    const contentRef = useRef<HTMLDivElement>(null);

    if (!selectedArtifact) {
        return null;
    }

    const artifact = selectedArtifact;
    const versionCount = selectedId ? registry[selectedId]?.versions.length : undefined;
    const switcherEntries = buildSwitcherEntries(registry, hasUnseenRevision);

    const handleCopy = () => {
        void navigator.clipboard.writeText(artifact.content).then(() => {
            setCopySuccess(true);
            setTimeout(() => {
                setCopySuccess(false);
            }, 1500);
        });
    };

    const handleDownload = () => {
        const ext = artifact.type === 'document' ? 'md' : getFileExtension(artifact.language ?? 'txt');
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
            />
            <div
                ref={contentRef}
                className="artifact-content-area relative flex flex-column flex-1 overflow-hidden w-full"
            >
                <ArtifactContent artifact={artifact} showLineNumbers={showLineNumbers} />
                <ArtifactInlineEdit
                    containerRef={contentRef}
                    artifactId={artifact.id}
                    title={artifact.title}
                    artifactType={artifact.type}
                    isGenerating={isGenerating || isSelectedVersionProvisional}
                />
            </div>
        </div>
    );
};

export default ArtifactPanel;
