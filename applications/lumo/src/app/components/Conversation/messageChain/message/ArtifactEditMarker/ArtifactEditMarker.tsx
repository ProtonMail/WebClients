import { memo } from 'react';

import { c } from 'ttag';

import { IcPencil } from '@proton/icons/icons/IcPencil';

import type { Message } from '../../../../../types';
import { useArtifactContext } from '../../../artifact/ArtifactContext';
import { getArtifactVersionIndexForMessage } from '../../../artifact/artifactRegistry';

type ArtifactEditMarkerProps = {
    message: Message;
};

// Renders a manual artifact-edit message as a small clickable divider (not a chat bubble),
// so the edit stays discoverable from the transcript even after the artifact panel is closed.
// Clicking it jumps the panel straight to the version this edit produced.
const ArtifactEditMarkerComponent = ({ message }: ArtifactEditMarkerProps) => {
    const { registry, openArtifact } = useArtifactContext();
    const meta = message.artifactManualEdit;

    if (!meta) {
        return null;
    }

    const handleClick = () => {
        const versionIndex = getArtifactVersionIndexForMessage(registry, meta.artifactId, message.id) ?? undefined;
        openArtifact(meta.artifactId, versionIndex);
    };

    return (
        <div className="artifact-edit-marker flex-1 w-full min-w-0 my-2">
            <button
                type="button"
                className="w-full flex flex-nowrap items-center gap-2 color-weak text-left py-1 px-2 rounded text-sm border-none bg-transparent justify-end"
                onClick={handleClick}
            >
                <IcPencil size={4} className="shrink-0 color-hint" />
                <span className="text-ellipsis overflow-hidden whitespace-nowrap">
                    {c('collider_2025:Info').t`You edited ${meta.artifactTitle}`}
                </span>
            </button>
        </div>
    );
};

export const ArtifactEditMarker = memo(ArtifactEditMarkerComponent);
export default ArtifactEditMarker;
