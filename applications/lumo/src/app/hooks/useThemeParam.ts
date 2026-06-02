import { useEffect } from 'react';

import { useLumoDispatch } from '../redux/hooks';
import { updateLumoUserSettings } from '../redux/slices/lumoUserSettings';
import { useQueryParam } from './useQueryParam';

/**
 * Applies a theme passed via a `?theme=light|dark|auto` link.
 *
 * Used by the embedded `/agent` surface so it can match the theme of the host page that
 * frames it (e.g. the account sign-in iframe). It updates the Lumo theme setting, which
 * `LumoThemeProvider` reacts to. Guests have no persisted theme, so this only affects the
 * current session.
 */
export function useThemeParam() {
    const dispatch = useLumoDispatch();
    const themeParam = useQueryParam('theme');

    useEffect(() => {
        if (themeParam === 'light' || themeParam === 'dark' || themeParam === 'auto') {
            dispatch(updateLumoUserSettings({ theme: themeParam }));
        }
    }, [themeParam, dispatch]);
}
