import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import ArtifactPanel from './ArtifactPanel';

import './ArtifactPanel.scss';

interface ArtifactPanelFullscreenOverlayProps {
    isOpen: boolean;
    isGenerating?: boolean;
    onExitFullscreen: () => void;
}

export const ArtifactPanelFullscreenOverlay = ({
    isOpen,
    isGenerating = false,
    onExitFullscreen,
}: ArtifactPanelFullscreenOverlayProps) => {
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onExitFullscreen();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onExitFullscreen]);

    if (!isOpen) {
        return null;
    }

    return createPortal(
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div
            className="artifact-fullscreen-overlay fixed inset-0 z-previewer flex flex-column bg-norm"
            role="dialog"
            aria-modal="true"
            aria-label={c('collider_2025:Label').t`Artifact full screen view`}
        >
            <ArtifactPanel isGenerating={isGenerating} layout="fullscreen" />
        </div>,
        document.body
    );
};
