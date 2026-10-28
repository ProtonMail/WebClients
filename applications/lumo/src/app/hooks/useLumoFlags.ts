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
 * - lumoNativeAuthAndroid: Enable native auth on the Android app
 * - lumoNativeAuthIOS: Enable native auth on the iOS app
 * - memory: Enable the memory feature (saved memories used to personalize general chats)
 * - visualizationInstructions: Enable chart and KPI card formatting instructions in the system prompt
 * - customAgents: Enable the custom agents option in the composer tools dropdown
 * - artifactsView: Enable the create-artifact composer tool and artifact panel interactions
 * - askUserQuestionsTool: Enable the ask-user-questions client tool
 * - artifactsViewSpotlight: Enable the create-artifact onboarding spotlight and New label
 * - artifactSlides: Let the model create slide decks (`presentation` artifacts)
 * - aiPaperTrailRoute: Enable the AI Paper Trail route (/aitrail)
 * - aiPaperTrailPopup: Show the AI Paper Trail popup panel on the home screen
 * - maxAvailableFree: When enabled, free users can select Lumo Max (default off during high load)
 * - maxAvailableGuest: When enabled, guest users can select Lumo Max (default off during high load)
 * - apertusModelAvailable: Enable the Apertus 15 model in the composer model picker
 * - previewModelAvailable: Enable the internal Lumo Preview model in the composer model picker
 * - dictationV2: Show the dictation mic button in the composer toolbar
 * - schedules: Enable scheduled tasks (sidebar nav, /schedules page)
 * - createScheduleTool: Enable the create-schedule client tool when scheduled tasks are also enabled
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
    const allowPurchasingCredits = useFlag('LumoAllowPurchasingCredits');
    const lumoSurveyFreeUsers = useFlag('LumoSurveyFreeUsers');
    const lumoSurveyPaidUsers = useFlag('LumoSurveyPaidUsers');
    const lumoSurveyGuestUsers = useFlag('LumoSurveyGuestUsers');
    const memory = useFlag('LumoMeowmory');
    const visualizationInstructions = useFlag('LumoVisualizationInstructions');
    const lumoNativeAuthAndroid = useFlag('LumoNativeAuthAndroid');
    const lumoNativeAuthIOS = useFlag('LumoNativeAuthIOS');
    const customAgents = useFlag('LumoCustomAgents');
    const artifactsView = useFlag('LumoArtifactsView');
    const askUserQuestionsTool = useFlag('LumoAskUserQuestionsTool');
    const artifactsViewSpotlight = useFlag('LumoArtifactsViewSpotlight');
    const artifactSlides = useFlag('LumoArtifactSlides');
    const aiPaperTrailRoute = useFlag('LumoAiPaperTrailRoute');
    const aiPaperTrailPopup = useFlag('LumoAiPaperTrailPopup');
    const maxAvailableFree = useFlag('LumoMaxAvailableFree');
    const maxAvailableGuest = useFlag('LumoMaxAvailableGuest');
    const apertusModelAvailable = useFlag('LumoApertusModel');
    const previewModelAvailable = useFlag('LumoPreviewModel');
    const dictationV2 = useFlag('LumoDictationV2');
    const schedules = useFlag('LumoSchedules');
    const createScheduleTool = useFlag('LumoCreateScheduleTool');

    return {
        memory,
        visualizationInstructions,
        customAgents,
        artifactsView,
        askUserQuestionsTool,
        artifactsViewSpotlight,
        artifactSlides,
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
        allowPurchasingCredits,
        lumoSurveyFreeUsers,
        lumoSurveyPaidUsers,
        lumoSurveyGuestUsers,
        lumoNativeAuthAndroid,
        lumoNativeAuthIOS,
        maxAvailableFree,
        maxAvailableGuest,
        apertusModelAvailable,
        previewModelAvailable,
        dictationV2,
        schedules,
        createScheduleTool,
    };
};
