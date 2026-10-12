import type { MouseEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { downloadBlob } from '../../../util/pdf/downloadBlob';
import { getArtifactDrawerTypeLabel } from '../../Conversation/artifact/artifactDrawerTypeLabel';
import { buildArtifactSourceDownloadFile } from '../../Conversation/artifact/artifactSourceDownload';
import { ARTIFACT_TYPE_CONFIG } from '../../Conversation/artifact/artifactTypeConfig';
import type { ConversationArtifactDrawerEntry } from '../../Conversation/artifact/conversationArtifactDrawerList';

interface KnowledgeBaseArtifactsSectionProps {
    artifacts: ConversationArtifactDrawerEntry[];
    onOpenArtifact: (artifactId: string) => void;
}

export const KnowledgeBaseArtifactsSection = ({ artifacts, onOpenArtifact }: KnowledgeBaseArtifactsSectionProps) => {
    if (artifacts.length === 0) {
        return null;
    }

    return (
        <div className="mb-6 w-full">
            <h3 className="text-sm text-bold mb-1">
                {c('collider_2025: Info').t`Artifacts`}{' '}
                <span className="color-weak text-normal">{artifacts.length}</span>
            </h3>
            <p className="text-xs color-weak mb-3">
                {c('collider_2025: Info').t`Created by ${LUMO_SHORT_APP_NAME} in this conversation.`}
            </p>

            {artifacts.map((artifact) => {
                const TypeIcon = ARTIFACT_TYPE_CONFIG[artifact.type].icon;
                const typeLabel = getArtifactDrawerTypeLabel(artifact.type, artifact.language);

                const handleDownload = (event: MouseEvent) => {
                    event.stopPropagation();
                    void buildArtifactSourceDownloadFile({
                        id: artifact.id,
                        type: artifact.type,
                        title: artifact.title,
                        content: artifact.content,
                        language: artifact.language,
                    }).then((file) => {
                        downloadBlob(new Blob([file.data], { type: file.mimeType }), file.fileName);
                    });
                };

                return (
                    <button
                        key={artifact.id}
                        type="button"
                        className="knowledge-base-artifact-row flex flex-row items-center gap-3 border border-weak rounded-lg p-3 mb-2 w-full text-left bg-norm cursor-pointer hover:bg-weak"
                        onClick={() => {
                            onOpenArtifact(artifact.id);
                        }}
                    >
                        <span
                            className="knowledge-base-artifact-row-icon shrink-0 flex items-center justify-center rounded-lg bg-weak w-custom h-custom"
                            style={{ '--w-custom': '2.25rem', '--h-custom': '2.25rem' } as React.CSSProperties}
                            aria-hidden
                        >
                            <TypeIcon className="color-weak" size={4} />
                        </span>
                        <span className="flex flex-1 flex-column min-w-0 gap-0.5 text-left">
                            <span className="text-sm text-semibold color-norm text-ellipsis overflow-hidden whitespace-nowrap">
                                {artifact.title}
                            </span>
                            <span className="text-xs color-weak">{typeLabel}</span>
                        </span>
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
                    </button>
                );
            })}
        </div>
    );
};
