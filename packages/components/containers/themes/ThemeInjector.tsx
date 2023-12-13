import { useEffect, useLayoutEffect, useMemo } from 'react';

import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { updateTheme } from '@proton/shared/lib/api/settings';
import { getIsDrawerApp, postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import { ThemeSetting, electronAppTheme, getDefaultThemeSetting } from '@proton/shared/lib/themes/themes';
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
    const legacyThemeSettings = useMemo(() => getDefaultThemeSetting(legacyThemeType), [legacyThemeType]);
    const themeSetting = userSettings.Theme && 'Mode' in userSettings.Theme ? userSettings.Theme : legacyThemeSettings;

    useLayoutEffect(() => {
        if (isElectronApp()) {
            setThemeSetting(electronAppTheme);
            return;
        }

        setThemeSetting(themeSetting);
    }, [themeSetting]);

    useLayoutEffect(() => {
        // If apps are opened in drawer, update their theme too
        if (iframeSrcMap) {
            Object.keys(iframeSrcMap).map((app) => {
                if (getIsDrawerApp(app)) {
                    postMessageToIframe({ type: DRAWER_EVENTS.UPDATE_THEME, payload: { themeSetting: settings } }, app);
                }
            });
        }
    }, [settings]);

    useEffect(() => {
        rootFontSize(true);
    }, [settings.FontSize]);

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
