import { useLayoutEffect, useRef } from 'react';

import { clsx } from 'clsx';

import { useArtifactPanelHostActions, useArtifactPanelHostLayout } from '../../../providers/ArtifactPanelHostProvider';

import '../ConversationComponent.scss';

/**
 * Desktop shell for the docked artifact panel — a flex sibling of main content and the files drawer.
 * The mount node stays in the DOM so ArtifactPanelSlot can portal as soon as the panel opens.
 */
export const ArtifactPanelHost = () => {
    const { isHostVisible, panelFlexBasisPct } = useArtifactPanelHostLayout();
    const { registerMountEl } = useArtifactPanelHostActions();
    const mountRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        registerMountEl(mountRef.current);
        return () => {
            registerMountEl(null);
        };
    }, [registerMountEl]);

    return (
        <aside
            className={clsx(
                'artifact-panel-host hidden md:flex flex-column min-h-0 shrink-0 min-w-0 h-full overflow-hidden',
                isHostVisible && 'artifact-panel-host--visible mr-2 mb-2'
            )}
            style={
                isHostVisible
                    ? { flex: `0 0 ${panelFlexBasisPct}%` }
                    : { flex: '0 0 0px', width: 0, minWidth: 0, margin: 0, padding: 0, border: 'none' }
            }
            aria-hidden={!isHostVisible}
            aria-label="Artifact panel"
        >
            <div
                ref={mountRef}
                className="artifact-panel-host-mount flex flex-column flex-1 min-h-0 min-w-0 overflow-hidden h-full"
            />
        </aside>
    );
};
