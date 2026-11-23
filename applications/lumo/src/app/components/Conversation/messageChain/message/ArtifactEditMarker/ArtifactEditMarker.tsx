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
        openArtifact(meta.artifactId, versionIndex, 'edit-marker');
    };

    return (
        <div className="artifact-edit-marker flex-1 w-full min-w-0 my-2">
            <button
                type="button"
                className="flex flex-nowrap items-center justify-end gap-2 w-full px-2 py-1 border-none radius-8 lumo-body-small text-left lumo-color-glyph-mid bg-transparent"
                onClick={handleClick}
            >
                <IcPencil size={4} className="shrink-0 lumo-color-glyph-mid" />
                <span className="text-ellipsis overflow-hidden whitespace-nowrap">
                    {c('collider_2025:Info').t`You edited ${meta.artifactTitle}`}
                </span>
            </button>
        </div>
    );
};

export const ArtifactEditMarker = memo(ArtifactEditMarkerComponent);
