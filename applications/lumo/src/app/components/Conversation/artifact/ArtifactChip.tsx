import { clsx } from 'clsx';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import type { MessageId } from '../../../types';
import { ArtifactChipShell } from './ArtifactChipShell';
import { useArtifactContext } from './ArtifactContext';
import {
    type ArtifactChipVisualState,
    getArtifactChipVersionNumber,
    getArtifactChipVisualState,
    getArtifactLineCount,
    getArtifactWordCount,
} from './artifactChipHelpers';
import { getArtifactVersionIndexForMessage } from './artifactRegistry';
import type { ParsedArtifact } from './parseArtifacts';

interface CompleteChipProps {
    artifact: ParsedArtifact;
    messageId: MessageId;
}

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
            openArtifact(artifact.id, versionIndex, 'chip');
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
        <ArtifactChipShell
            type={artifact.type}
            visualState={visualState}
            className="mt-2 mb-4"
            title={artifact.title}
            subtitle={
                <ArtifactChipSubtitle artifact={artifact} visualState={visualState} versionNumber={versionNumber} />
            }
            onClick={versionIndex === null ? undefined : handleAction}
            disabled={versionIndex === null}
            actions={
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
            }
        />
    );
};
