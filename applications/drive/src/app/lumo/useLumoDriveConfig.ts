import { useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { buildLumoDriveConfig } from './registry';
import type { OpenFile } from './toolModule';

interface Surface {
    /**
     * Pass this key to give the surface the open-file tool. The preview always passes it, even on the
     * first render where the file is still loading and the value is undefined; the drawer omits it.
     */
    openFile?: OpenFile;
}

/**
 * Builds this surface's Lumo config once. `useLumoAgent` rebuilds its executor — and so resets the
 * reference registry — whenever the config identity changes, so on-screen state is passed as a plain
 * value, refreshed into a ref each render, and the config's getters read that ref at call time. Callers
 * pass values, never getters: a getter would be a new identity every render.
 *
 * Used by every Drive surface that runs the assistant: the drawer (through {@link LumoDriveProvider}) and
 * the file preview.
 */
export const useLumoDriveConfig = (surface: Surface = {}) => {
    const { pathname } = useLocation();

    const latest = useRef({ pathname, surface });
    latest.current = { pathname, surface };

    // Which tools this surface gets is fixed on mount, since the config is built once.
    const hasOpenFile = 'openFile' in surface;

    return useMemo(
        () =>
            buildLumoDriveConfig({
                getPathname: () => latest.current.pathname,
                getOpenFile: hasOpenFile ? () => latest.current.surface.openFile : undefined,
            }),

        []
    );
};
