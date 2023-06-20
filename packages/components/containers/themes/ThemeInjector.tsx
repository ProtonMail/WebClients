import { useEffect, useLayoutEffect, useMemo } from 'react';

import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { updateTheme, updateThemeType } from '@proton/shared/lib/api/settings';
import { postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_APPS, DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import { ThemeSetting, getDefaultThemeSetting } from '@proton/shared/lib/themes/themes';
import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

import { FeatureCode } from '../../containers/features/FeaturesContext';
import { useApi, useDrawer, useFeature, useUserSettings } from '../../hooks';
import { useTheme } from './ThemeProvider';

const ThemeInjector = () => {
    const [userSettings] = useUserSettings();
    const { addListener, settings, setThemeSetting, setAccessibilitySettingsEnabled } = useTheme();
    const api = useApi();
    const silentApi = getSilentApi(api);
    const isAccessibilitySettingsEnabled =
        useFeature<boolean>(FeatureCode.AccessibilitySettings)?.feature?.Value === true;

    const { iframeSrcMap } = useDrawer();

    const legacyThemeType = userSettings.ThemeType;
    const legacyThemeSettings = useMemo(() => getDefaultThemeSetting(legacyThemeType), [legacyThemeType]);
    const themeSetting =
        isAccessibilitySettingsEnabled && userSettings.Theme && 'Mode' in userSettings.Theme
            ? userSettings.Theme
            : legacyThemeSettings;

    useLayoutEffect(() => {
        setAccessibilitySettingsEnabled(isAccessibilitySettingsEnabled);
    }, [isAccessibilitySettingsEnabled]);

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
        rootFontSize(true);
    }, [settings.FontSize]);

    useEffect(() => {
        const cb = debounce((settings: ThemeSetting) => {
            if (isAccessibilitySettingsEnabled) {
                silentApi(updateTheme(settings)).catch(noop);
            } else {
                silentApi(updateThemeType(settings.LightTheme)).catch(noop);
            }
        }, 500);

        const removeListener = addListener(cb);
        return () => {
            removeListener();
        };
    }, []);

    return null;
};
export default ThemeInjector;
