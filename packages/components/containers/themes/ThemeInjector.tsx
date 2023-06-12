import { useEffect, useLayoutEffect } from 'react';

import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { updateTheme } from '@proton/shared/lib/api/settings';
import { postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_APPS, DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { ThemeSetting, getDefaultThemeSetting } from '@proton/shared/lib/themes/themes';
import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

import { useApi, useDrawer, useUserSettings } from '../../hooks';
import { useTheme } from './ThemeProvider';

const ThemeInjector = () => {
    const [userSettings] = useUserSettings();
    const { addListener, settings, setThemeSetting } = useTheme();
    const api = useApi();
    const silentApi = getSilentApi(api);

    const { iframeSrcMap } = useDrawer();

    const legacyThemeType = userSettings.ThemeType;
    const themeSetting =
        userSettings.Theme && 'Mode' in userSettings.Theme
            ? userSettings.Theme
            : getDefaultThemeSetting(legacyThemeType);

    useLayoutEffect(() => {
        setThemeSetting(themeSetting);
    }, [themeSetting]);

    useLayoutEffect(() => {
        // If apps are opened in drawer, update their theme too
        if (iframeSrcMap) {
            Object.keys(iframeSrcMap).map((app) => {
                postMessageToIframe(
                    { type: DRAWER_EVENTS.UPDATE_THEME, payload: { themeSetting: settings } },
                    app as DRAWER_APPS
                );
            });
        }
    }, [settings]);

    useEffect(() => {
        const cb = debounce((settings: ThemeSetting) => {
            silentApi(updateTheme(settings)).catch(noop);
        }, 500);

        const removeListener = addListener(cb);
        return () => {
            removeListener();
        };
    }, []);

    return null;
};
export default ThemeInjector;
