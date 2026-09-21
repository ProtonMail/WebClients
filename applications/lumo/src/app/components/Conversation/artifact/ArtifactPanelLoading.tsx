import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useEncryptedTextAnimation } from '../../../hooks/useEncryptedTextAnimation';
import { ARTIFACT_TYPE_CONFIG } from './artifactTypeConfig';
import type { ArtifactType } from './parseArtifacts';

const ARTIFACT_ICON_TYPES: ArtifactType[] = ['document', 'code', 'webpage', 'presentation'];

const LOADING_MESSAGES = [
    () => c('collider_2025:Info').t`Creating artifact…`,
    () => c('collider_2025:Info').t`Preparing your side panel…`,
    () => c('collider_2025:Info').t`Drafting content…`,
    () => c('collider_2025:Info').t`Almost ready…`,
] as const;

const ICON_CYCLE_MS = 4000;
const MESSAGE_CYCLE_MS = 4000;

export const ArtifactPanelLoading = () => {
    const [iconIndex, setIconIndex] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);
    const message = LOADING_MESSAGES[messageIndex]?.() ?? LOADING_MESSAGES[0]();
    const { displayText } = useEncryptedTextAnimation(message, { animateOnChange: true, duration: 520 });

    useEffect(() => {
        const iconTimer = window.setInterval(() => {
            setIconIndex((current) => {
                return (current + 1) % ARTIFACT_ICON_TYPES.length;
            });
        }, ICON_CYCLE_MS);

        const messageTimer = window.setInterval(() => {
            setMessageIndex((current) => {
                return (current + 1) % LOADING_MESSAGES.length;
            });
        }, MESSAGE_CYCLE_MS);

        return () => {
            window.clearInterval(iconTimer);
            window.clearInterval(messageTimer);
        };
    }, []);

    const iconType = ARTIFACT_ICON_TYPES[iconIndex] ?? 'document';
    const Icon = ARTIFACT_TYPE_CONFIG[iconType].icon;

    return (
        <div
            className="artifact-panel-loading relative flex flex-column flex-1 min-h-0 min-w-0 items-center justify-center gap-4 p-6"
            aria-busy="true"
            aria-live="polite"
        >
            <Icon key={iconType} size={8} className="artifact-panel-loading-icon color-primary" aria-hidden="true" />
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

export default ArtifactPanelLoading;
