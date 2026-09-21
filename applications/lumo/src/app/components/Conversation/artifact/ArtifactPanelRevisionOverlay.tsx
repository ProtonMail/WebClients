import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useEncryptedTextAnimation } from '../../../hooks/useEncryptedTextAnimation';
import { ARTIFACT_TYPE_CONFIG } from './artifactTypeConfig';
import type { ArtifactType } from './parseArtifacts';

const REVISION_MESSAGES = [
    () => c('collider_2025:Info').t`Revising your artifact…`,
    () => c('collider_2025:Info').t`Applying your changes…`,
    () => c('collider_2025:Info').t`Updating content…`,
    () => c('collider_2025:Info').t`Almost ready…`,
] as const;

const MESSAGE_CYCLE_MS = 4000;

interface ArtifactPanelRevisionOverlayProps {
    artifactType: ArtifactType;
}

export const ArtifactPanelRevisionOverlay = ({ artifactType }: ArtifactPanelRevisionOverlayProps) => {
    const [messageIndex, setMessageIndex] = useState(0);
    const message = REVISION_MESSAGES[messageIndex]?.() ?? REVISION_MESSAGES[0]();
    const { displayText } = useEncryptedTextAnimation(message, { animateOnChange: true, duration: 520 });
    const Icon = ARTIFACT_TYPE_CONFIG[artifactType].icon;

    useEffect(() => {
        const messageTimer = window.setInterval(() => {
            setMessageIndex((current) => {
                return (current + 1) % REVISION_MESSAGES.length;
            });
        }, MESSAGE_CYCLE_MS);

        return () => {
            window.clearInterval(messageTimer);
        };
    }, []);

    return (
        <div
            className="artifact-panel-revision-overlay absolute inset-0 flex flex-column items-center justify-center gap-4 p-6 bg-norm pointer-events-none z-1"
            aria-busy="true"
            aria-live="polite"
        >
            <Icon size={8} className="artifact-panel-loading-icon color-primary" aria-hidden="true" />
            <span className="artifact-panel-loading-text text-sm color-weak text-monospace text-center">
                {displayText}
            </span>
            <div
                className="artifact-panel-loading-skeleton flex flex-column gap-3 w-full max-w-custom"
                style={{ '--max-w-custom': '28rem' } as React.CSSProperties}
            >
                <div className="rectangle-skeleton keep-motion rounded w-full" style={{ height: '0.875rem' }} />
                <div className="rectangle-skeleton keep-motion rounded w-full" style={{ height: '0.875rem' }} />
                <div className="rectangle-skeleton keep-motion rounded w-3/4" style={{ height: '0.875rem' }} />
                <div className="rectangle-skeleton keep-motion rounded w-full mt-2" style={{ height: '6rem' }} />
            </div>
        </div>
    );
};

export default ArtifactPanelRevisionOverlay;
