import type { MouseEvent } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { triggerFileDownload } from '../../../util/triggerFileDownload';
import { ArtifactChipShell } from '../../Conversation/artifact/ArtifactChipShell';
import { getArtifactDrawerTypeLabel } from '../../Conversation/artifact/artifactDrawerTypeLabel';
import { buildArtifactSourceDownloadFile } from '../../Conversation/artifact/artifactSourceDownload';
import type { ConversationArtifactDrawerEntry } from '../../Conversation/artifact/conversationArtifactDrawerList';

interface KnowledgeBaseArtifactsSectionProps {
    artifacts: ConversationArtifactDrawerEntry[];
    onOpenArtifact: (artifactId: string) => void;
}

export const KnowledgeBaseArtifactsSection = ({ artifacts, onOpenArtifact }: KnowledgeBaseArtifactsSectionProps) => {
    const { createNotification } = useNotifications();

    if (artifacts.length === 0) {
        return null;
    }

    return (
        <div className="mb-6 w-full min-w-0 max-w-full">
            <h3 className="text-sm text-bold mb-1">
                {c('collider_2025: Info').t`creations`}{' '}
                <span className="color-weak text-normal">{artifacts.length}</span>
            </h3>
            <p className="text-xs color-weak mb-3">
                {c('collider_2025: Info').t`Created by ${LUMO_SHORT_APP_NAME} in this conversation.`}
            </p>

            {artifacts.map((artifact) => {
                const typeLabel = getArtifactDrawerTypeLabel(artifact.type, artifact.language);

                // Same error toast as the panel and Library (`useArtifactFileActions`). No download
                // telemetry yet: `ArtifactDownloadLayout` has no value for this drawer.
                const handleDownload = async (event: MouseEvent) => {
                    event.stopPropagation();
                    try {
                        const file = await buildArtifactSourceDownloadFile({
                            id: artifact.id,
                            type: artifact.type,
                            title: artifact.title,
                            content: artifact.content,
                            language: artifact.language,
                        });
                        await triggerFileDownload(new Blob([file.data], { type: file.mimeType }), file.fileName);
                    } catch {
                        createNotification({
                            type: 'error',
                            text: c('collider_2025: Error').t`Could not download this file.`,
                        });
                    }
                };

                return (
                    <ArtifactChipShell
                        key={artifact.id}
                        type={artifact.type}
                        className="mt-2 mb-4"
                        title={artifact.title}
                        subtitle={
                            <span className="text-xs color-weak block w-full min-w-0 text-ellipsis overflow-hidden whitespace-nowrap">
                                {typeLabel}
                            </span>
                        }
                        onClick={() => {
                            onOpenArtifact(artifact.id);
                        }}
                        actions={
                            <Button
                                color="weak"
                                shape="outline"
                                size="small"
                                className="shrink-0"
                                onClick={handleDownload}
                                title={c('collider_2025:Action').t`Download`}
                            >
                                {c('collider_2025:Action').t`Download`}
                            </Button>
                        }
                    />
                );
            })}
        </div>
    );
};
