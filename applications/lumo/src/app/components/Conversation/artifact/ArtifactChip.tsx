import { clsx } from 'clsx';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import type { MessageId } from '../../../types';
import { useArtifactContext } from './ArtifactContext';
import {
    type ArtifactChipVisualState,
    getArtifactChipVersionNumber,
    getArtifactChipVisualState,
    getArtifactLineCount,
    getArtifactWordCount,
} from './artifactChipHelpers';
import { getArtifactVersionIndexForMessage } from './artifactRegistry';
import { ARTIFACT_TYPE_CONFIG } from './artifactTypeConfig';
import type { ParsedArtifact } from './parseArtifacts';

interface CompleteChipProps {
    artifact: ParsedArtifact;
    messageId: MessageId;
}

const ArtifactChipIcon = ({
    type,
    visualState,
}: {
    type: ParsedArtifact['type'];
    visualState: ArtifactChipVisualState;
}) => {
    const Icon = ARTIFACT_TYPE_CONFIG[type].icon;

    return (
        <span
            className={clsx(
                'artifact-chip-icon shrink-0 flex items-center justify-center rounded',
                visualState === 'active' && 'artifact-chip-icon--active',
                visualState === 'superseded' && 'artifact-chip-icon--superseded'
            )}
        >
            <Icon size={4} />
        </span>
    );
};

interface ArtifactChipSubtitleProps {
    artifact: ParsedArtifact;
    visualState: ArtifactChipVisualState;
    versionNumber: number;
}

const ArtifactChipSubtitle = ({ artifact, visualState, versionNumber }: ArtifactChipSubtitleProps) => {
    if (visualState === 'active') {
        return (
            <span className="text-xs color-weak">{c('collider_2025:Info').t`Open in panel • v${versionNumber}`}</span>
        );
    }

    const lineCount = getArtifactLineCount(artifact.content);
    const wordCount = getArtifactWordCount(artifact.content);
    // Line count only makes sense for code; document and webpage (source is markup, not prose,
    // but there's no more meaningful count available without executing it) both fall back to
    // word count.
    const countLabel =
        artifact.type === 'code'
            ? c('collider_2025:Info').ngettext(msgid`${lineCount} line`, `${lineCount} lines`, lineCount)
            : c('collider_2025:Info').ngettext(msgid`${wordCount} word`, `${wordCount} words`, wordCount);

    return (
        <span className={clsx('text-xs', visualState === 'superseded' ? 'color-hint' : 'color-weak')}>
            {countLabel} • {c('collider_2025:Info').t`v${versionNumber}`}
        </span>
    );
};

export const ArtifactChip = ({ artifact, messageId }: CompleteChipProps) => {
    const { openArtifact, closePanel, selectedId, selectedVersionIndex, registry } = useArtifactContext();
    const versionIndex = getArtifactVersionIndexForMessage(registry, artifact.id, messageId);
    const visualState = getArtifactChipVisualState({
        artifactId: artifact.id,
        messageId,
        selectedId,
        selectedVersionIndex,
        registry,
    });
    const versionNumber = getArtifactChipVersionNumber(registry, artifact.id, messageId);

    const handleOpen = () => {
        if (versionIndex !== null) {
            openArtifact(artifact.id, versionIndex);
        }
    };

    const handleAction = () => {
        if (visualState === 'active') {
            closePanel();
            return;
        }
        handleOpen();
    };

    const actionLabel = (() => {
        if (visualState === 'active') {
            return c('collider_2025:Action').t`Close`;
        }
        if (visualState === 'superseded') {
            return c('collider_2025:Action').t`View v${versionNumber}`;
        }
        return c('collider_2025:Action').t`Open`;
    })();

    const actionButtonProps = { color: 'weak' as const, shape: 'outline' as const };

    return (
        <button
            tabIndex={versionIndex === null ? -1 : 0}
            className={clsx(
                'artifact-chip flex flex-row items-center gap-3 border rounded-lg p-3 mt-2 mb-4 w-full text-left bg-norm border-weak',
                visualState === 'superseded' && 'artifact-chip--superseded',
                versionIndex !== null && 'cursor-pointer'
            )}
            onClick={versionIndex === null ? undefined : handleAction}
            onKeyDown={(event) => {
                if (versionIndex === null) {
                    return;
                }
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleAction();
                }
            }}
        >
            <ArtifactChipIcon type={artifact.type} visualState={visualState} />
            <div className="flex-1 min-w-0 flex flex-column items-start gap-0.5 text-left">
                <span
                    className={clsx(
                        'text-sm text-ellipsis overflow-hidden whitespace-nowrap',
                        visualState === 'superseded' ? 'color-hint' : 'color-norm text-semibold'
                    )}
                >
                    {artifact.title}
                </span>
                <ArtifactChipSubtitle artifact={artifact} visualState={visualState} versionNumber={versionNumber} />
            </div>
            <Button
                {...actionButtonProps}
                size="small"
                className="shrink-0"
                disabled={versionIndex === null}
                onClick={(event) => {
                    event.stopPropagation();
                    handleAction();
                }}
                title={actionLabel}
            >
                {actionLabel}
            </Button>
        </button>
    );
};

export default ArtifactChip;
