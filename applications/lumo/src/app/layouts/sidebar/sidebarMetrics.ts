import type { SidebarLayout } from '../../remote/nativeComposerBridge';

/** Used when the custom properties in index.scss can't be read (e.g. jsdom, CSS not yet applied). */
export const SIDEBAR_FALLBACK_EXPANDED_WIDTH_PX = 300;
export const SIDEBAR_FALLBACK_TRANSITION_MS = 300;

export interface SidebarMetrics {
    /** Width of the sidebar when expanded, in CSS px. */
    expandedWidth: number;
    /** Duration of the sidebar's width transition, in ms. */
    transitionMs: number;
}

/**
 * `getPropertyValue` on an unregistered custom property returns the raw declared text, so this is
 * the only unit guard for `--lumo-sidebar-expanded-width`. Requires `px` (case-insensitively) and
 * falls back otherwise, so a token rewritten in another CSS unit (e.g. `rem()`'s `18.75rem`) is
 * caught instead of silently misreporting its numeric value as px.
 */
const parseCssLength = (value: string, fallback: number): number => {
    const trimmed = value.trim();
    const match = /^(-?[\d.]+)px$/i.exec(trimmed);
    if (!match) {
        return fallback;
    }
    const parsed = Number.parseFloat(match[1]);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseCssDuration = (value: string, fallback: number): number => {
    const trimmed = value.trim();
    const parsed = Number.parseFloat(trimmed);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    // `300ms` and `0.3s` are both valid CSS. Normalise to ms so a token rewritten in seconds
    // doesn't silently turn into a 0.3ms animation on the native side. Case-insensitive, and `ms`
    // is checked before `s` so `300MS` isn't read as seconds.
    if (/ms$/i.test(trimmed)) {
        return parsed;
    }
    return /s$/i.test(trimmed) ? parsed * 1000 : parsed;
};

/**
 * Reads the sidebar layout tokens declared in index.scss. Those custom properties are the single
 * source of truth: Sidebar.scss applies the same values to `inline-size` and to the transition, so
 * a design change reaches native without touching this file.
 */
export const readSidebarMetrics = (): SidebarMetrics => {
    const styles = getComputedStyle(document.documentElement);
    return {
        expandedWidth: parseCssLength(
            styles.getPropertyValue('--lumo-sidebar-expanded-width'),
            SIDEBAR_FALLBACK_EXPANDED_WIDTH_PX
        ),
        transitionMs: parseCssDuration(
            styles.getPropertyValue('--lumo-sidebar-transition-duration'),
            SIDEBAR_FALLBACK_TRANSITION_MS
        ),
    };
};

/**
 * Derives what native should be told about the sidebar. `animate` is false for layout jumps
 * (first paint, crossing the breakpoint) and true for user toggles.
 */
export const getNativeSidebarLayout = ({
    isSmallScreen,
    isSidebarVisible,
    animate,
    metrics,
}: {
    isSmallScreen: boolean;
    isSidebarVisible: boolean;
    animate: boolean;
    metrics: SidebarMetrics;
}): SidebarLayout | null => {
    if (isSmallScreen) {
        return null;
    }

    return {
        width: isSidebarVisible ? metrics.expandedWidth : 0,
        animationDurationMs: animate ? metrics.transitionMs : 0,
    };
};
