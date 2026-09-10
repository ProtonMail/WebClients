import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import ArtifactPanel from './ArtifactPanel';

import './ArtifactPanel.scss';

interface ArtifactPanelMobileOverlayProps {
    isOpen: boolean;
    isGenerating?: boolean;
}

export const ArtifactPanelMobileOverlay = ({ isOpen, isGenerating = false }: ArtifactPanelMobileOverlayProps) => {
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return createPortal(
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div
            className="artifact-panel-mobile-overlay flex flex-column bg-norm"
            role="dialog"
            aria-modal="true"
            aria-label={c('collider_2025:Label').t`Artifact view`}
        >
            <ArtifactPanel isGenerating={isGenerating} isMobileView />
        </div>,
        document.body
    );
};
