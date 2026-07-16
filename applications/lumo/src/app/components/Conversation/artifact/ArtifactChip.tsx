import { clsx } from 'clsx';
import { c } from 'ttag';

import { IcArrowOutFromRectangle } from '@proton/icons/icons/IcArrowOutFromRectangle';
import { IcCode } from '@proton/icons/icons/IcCode';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';

import { useArtifactContext } from './ArtifactContext';
import type { ParsedArtifact, StreamingArtifact } from './parseArtifacts';

// Chip for a fully-generated artifact — clickable, opens the panel
interface CompleteChipProps {
    artifact: ParsedArtifact;
}

export const ArtifactChip = ({ artifact }: CompleteChipProps) => {
    const { openArtifact, selectedId } = useArtifactContext();
    const isActive = selectedId === artifact.id;

    return (
        <button
            type="button"
            onClick={() => {
                openArtifact(artifact.id);
            }}
            className={clsx([
                'artifact-chip',
                'flex flex-row items-center gap-2',
                'border border-weak rounded-lg px-3 py-2 mt-2',
                'text-sm cursor-pointer text-norm',
                'w-full max-w-xs text-left',
                isActive && 'artifact-chip--active',
            ])}
        >
            <span className="shrink-0 color-hint">
                {artifact.type === 'code' ? <IcCode size={4} /> : <IcFileLines size={4} />}
            </span>
            <span className="flex-1 text-ellipsis overflow-hidden whitespace-nowrap">{artifact.title}</span>
            <span className="artifact-type-badge shrink-0">{artifact.type === 'code' ? 'CODE' : 'DOC'}</span>
            <IcArrowOutFromRectangle size={3} className="shrink-0 color-hint" />
        </button>
    );
};

// Chip shown while the artifact is still being streamed — not clickable
interface LoadingChipProps {
    streaming: StreamingArtifact;
}

export const ArtifactChipLoading = ({ streaming }: LoadingChipProps) => {
    const getTypeLabel = (type: string | undefined) => {
        if (type === 'code') {
            return 'CODE';
        }
        if (type === 'document') {
            return 'DOC';
        }
        return null;
    };

    const typeLabel = getTypeLabel(streaming.type);

    return (
        <div
            className={clsx([
                'artifact-chip',
                'flex flex-row items-center gap-2',
                'border border-weak rounded-lg px-3 py-4 my-2',
                'text-sm text-norm',
                'w-full max-w-xs',
                'opacity-60',
            ])}
            aria-busy="true"
        >
            <span className="shrink-0 color-hint">
                {(() => {
                    if (streaming.type === 'code') {
                        return <IcCode size={4} />;
                    }
                    if (streaming.type === 'document') {
                        return <IcFileLines size={4} />;
                    }
                    // Skeleton icon placeholder while we don't know the type yet
                    return (
                        <div
                            className="rectangle-skeleton keep-motion rounded"
                            style={{ width: '1rem', height: '1rem' }}
                        />
                    );
                })()}
            </span>
            {streaming.title ? (
                <span className="flex-1 text-ellipsis overflow-hidden whitespace-nowrap">{streaming.title}</span>
            ) : (
                <span className="flex-1">
                    <span
                        className="rectangle-skeleton keep-motion rounded inline-block"
                        style={{ width: '8rem', height: '0.875rem' }}
                    />
                </span>
            )}
            {typeLabel && <span className="artifact-type-badge shrink-0">{typeLabel}</span>}
            <span className="shrink-0 color-hint text-xs">{c('collider_2025:Status').t`…`}</span>
        </div>
    );
};

export default ArtifactChip;
