import type { AppStartListening } from '../store';
import { savePersonalizationSettings } from '../slices/personalization';
import { updateLumoUserSettingsWithAutoSave } from '../slices/lumoUserSettings';

/**
 * Start personalization-related listeners
 */
export function startPersonalizationListeners(startListening: AppStartListening) {
    // Save personalization changes and sync to user settings (only when save button is clicked)
    startListening({
        matcher: (action) => savePersonalizationSettings.match(action),
        effect: async (action, listenerApi) => {
            console.log('PersonalizationListener: Personalization save triggered', action.type, action.payload);
            const personalization = action.payload;
            
            console.log('PersonalizationListener: Saving personalization', personalization);
            
            // Sync to Lumo user settings and trigger remote API save
            console.log('PersonalizationListener: Syncing to Lumo user settings with auto-save');
            listenerApi.dispatch(updateLumoUserSettingsWithAutoSave({ personalization }));
        },
    });

}
