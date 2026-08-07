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
 * - lumoSurvey: Legacy survey flag (deprecated)
 * - lumoSurveyFreeUsers: Survey flag for free users
 * - lumoSurveyPaidUsers: Survey flag for paid users
 * - lumoSurveyGuestUsers: Survey flag for guest users
 * - memory: Enable the memory feature (saved memories used to personalize general chats)
 * - visualizationInstructions: Enable chart and KPI card formatting instructions in the system prompt
 * - customAgents: Enable the custom agents option in the composer tools dropdown
 * - maxAvailableFree: When enabled, free users can select Lumo Max (default off during high load)
 * - maxAvailableGuest: When enabled, guest users can select Lumo Max (default off during high load)
 * - aiPaperTrailRoute: Enable the AI Paper Trail route (/aitrail)
 * - aiPaperTrailPopup: Show the AI Paper Trail popup panel on the home screen
 */
export const useLumoFlags = () => {
    const imageTools = useFlag('LumoImageTools');
    const smoothRendering = useFlag('LumoSmoothedRendering');
    const externalTools = useFlag('LumoTooling');
    const specialTheme = useFlag('LumoSpecialTheme');
    const deactivateGuestMode = useFlag('LumoDeactivateGuestModeFrontend');
    const whatsNew = useFlag('WhatsNewV2');
    const highLoad = useFlag('LumoHighLoad');
    const nativeComposer = useFlag('LumoNativeComposer');
    const nativeComposerImages = useFlag('LumoNativeComposerImage');
    const nativeComposerModelSelection = useFlag('LumoNativeComposerModelSelection');
    const apiKeyManagement = useFlag('LumoAPIKeyManagement');
    const lumoSurveyFreeUsers = useFlag('LumoSurveyFreeUsers');
    const lumoSurveyPaidUsers = useFlag('LumoSurveyPaidUsers');
    const lumoSurveyGuestUsers = useFlag('LumoSurveyGuestUsers');
    const memory = useFlag('LumoMeowmory');
    const visualizationInstructions = useFlag('LumoVisualizationInstructions');
    const lumoNativeAuth = useFlag('LumoNativeAuth');
    const customAgents = useFlag('LumoCustomAgents');
    const aiPaperTrailRoute = useFlag('LumoAiPaperTrailRoute');
    const aiPaperTrailPopup = useFlag('LumoAiPaperTrailPopup');
    const maxAvailableFree = useFlag('LumoMaxAvailableFree');
    const maxAvailableGuest = useFlag('LumoMaxAvailableGuest');

    return {
        memory,
        visualizationInstructions,
        customAgents,
        aiPaperTrailRoute,
        aiPaperTrailPopup,
        imageTools,
        smoothRendering,
        externalTools,
        specialTheme,
        deactivateGuestMode,
        whatsNew,
        highLoad,
        nativeComposer,
        nativeComposerImages,
        nativeComposerModelSelection,
        apiKeyManagement,
        lumoSurveyFreeUsers,
        lumoSurveyPaidUsers,
        lumoSurveyGuestUsers,
        lumoNativeAuth,
        maxAvailableFree,
        maxAvailableGuest,
    };
};
