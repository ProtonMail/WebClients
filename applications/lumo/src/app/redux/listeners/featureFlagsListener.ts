import { dismissFeatureFlag } from '../slices/featureFlags';
import { updateLumoUserSettingsWithAutoSave } from '../slices/lumoUserSettings';
import type { AppStartListening } from '../store';

/**
 * Start feature flags-related listeners
 */
export function startFeatureFlagsListeners(startListening: AppStartListening) {
    // Save feature flags changes and sync to user settings (when feature is dismissed)
    startListening({
        matcher: (action) => dismissFeatureFlag.match(action),
        effect: async (action, listenerApi) => {
            console.log('FeatureFlagsListener: Feature flag dismissed', action.type, action.payload);
            const dismissedFeatureId = action.payload;

            console.log('FeatureFlagsListener: Saving feature flag dismissal', dismissedFeatureId);

            // Sync to Lumo user settings and trigger remote API save
            console.log('FeatureFlagsListener: Syncing to Lumo user settings with auto-save');
            listenerApi.dispatch(
                updateLumoUserSettingsWithAutoSave({
                    featureFlags: listenerApi.getState().featureFlags,
                })
            );
        },
    });
}
