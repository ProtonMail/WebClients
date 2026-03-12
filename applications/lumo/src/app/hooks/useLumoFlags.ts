import { useFlag } from '@proton/unleash/useFlag';

/**
 * Centralized hook for all Lumo feature flags.
 * This prevents multiple subscriptions to the same flags across the app.
 *
 * Available flags:
 * - imageTools: Enable image processing and drawing tools
 * - smoothRendering: Enable smooth rendering for messages
 * - externalTools: Enable external tools integration
 * - specialTheme: Enable special theme (e.g., cat theme)
 * - deactivateGuestMode: Deactivate guest mode on frontend
 * - whatsNew: Show "What's New" feature
 * - earlyAccess: Show early access features
 * - highLoad: Show high load warning
 * - nativeComposer: Hides the web composer and allows the mobile clients to use their own
 */
export const useLumoFlags = () => {
    const imageTools = useFlag('LumoImageTools');
    const smoothRendering = useFlag('LumoSmoothedRendering');
    const externalTools = useFlag('LumoTooling');
    const specialTheme = useFlag('LumoSpecialTheme');
    const deactivateGuestMode = useFlag('LumoDeactivateGuestModeFrontend');
    const whatsNew = useFlag('WhatsNewV1p3');
    const earlyAccess = useFlag('LumoEarlyAccess');
    const highLoad = useFlag('LumoHighLoad');
    const nativeComposer = useFlag('LumoNativeComposer');
    const nativeComposerImages = useFlag('LumoNativeComposerImage');
    const nativeComposerModelSelection = useFlag('LumoNativeComposerModelSelection');

    return {
        imageTools,
        smoothRendering,
        externalTools,
        specialTheme,
        deactivateGuestMode,
        whatsNew,
        earlyAccess,
        highLoad,
        nativeComposer,
        nativeComposerImages,
        nativeComposerModelSelection,
    };
};
