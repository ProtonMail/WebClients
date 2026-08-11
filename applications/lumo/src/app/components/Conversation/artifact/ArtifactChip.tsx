import { clsx } from 'clsx';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowOutFromRectangle } from '@proton/icons/icons/IcArrowOutFromRectangle';
import { IcCode } from '@proton/icons/icons/IcCode';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';

import type { MessageId } from '../../../types';
import { useArtifactContext } from './ArtifactContext';
import {
    type ArtifactChipVisualState,
    getArtifactChipVersionNumber,
    getArtifactChipVisualState,
    getArtifactLineCount,
    getArtifactWordCount,
    isArtifactChipAwaitingRegistry,
} from './artifactChipHelpers';
import { getArtifactVersionIndexForMessage } from './artifactRegistry';
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
    const icon = type === 'code' ? <IcCode size={4} /> : <IcFileLines size={4} />;

    return (
        <span
            className={clsx(
                'artifact-chip-icon shrink-0 flex items-center justify-center rounded',
                visualState === 'active' && 'artifact-chip-icon--active',
                visualState === 'default' && 'artifact-chip-icon--default',
                visualState === 'superseded' && 'artifact-chip-icon--superseded'
            )}
        >
            {icon}
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
            <span className="flex flex-row items-center gap-1 text-xs color-primary">
                <span className="artifact-chip-active-dot rounded-full bg-primary shrink-0" />
                {c('collider_2025:Info').t`Open in panel • v${versionNumber}`}
            </span>
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
    const isAwaitingRegistry = isArtifactChipAwaitingRegistry(registry, artifact.id, messageId);
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

    const actionButtonProps = (() => {
        if (visualState === 'active') {
            return { color: 'norm' as const, shape: 'outline' as const };
        }
        if (visualState === 'superseded') {
            return { color: 'weak' as const, shape: 'outline' as const };
        }
        return { color: 'norm' as const, shape: 'solid' as const };
    })();

    return (
        <div
            className={clsx(
                'artifact-chip flex flex-row items-center gap-3 border rounded-lg p-3 mt-2 mb-4 w-full',
                visualState === 'default' && 'bg-norm border-weak',
                visualState === 'active' && 'artifact-chip--active',
                visualState === 'superseded' && 'bg-norm border-weak artifact-chip--superseded'
            )}
        >
            <ArtifactChipIcon type={artifact.type} visualState={visualState} />
            <div className="flex-1 min-w-0 flex flex-column gap-0.5">
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
                pill
                className="shrink-0"
                disabled={visualState === 'default' && isAwaitingRegistry}
                onClick={handleAction}
                title={actionLabel}
            >
                {actionLabel}
                {visualState === 'default' && <IcArrowOutFromRectangle size={3} className="ml-1" />}
            </Button>
        </div>
    );
};

export default ArtifactChip;
