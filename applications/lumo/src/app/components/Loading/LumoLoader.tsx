import type {SyntheticEvent} from 'react';
import {useMemo} from 'react';

import Lottie from 'lottie-react';
import {c} from 'ttag';

import TextLoader from '@proton/components/components/loader/TextLoader';
import useConfig from '@proton/components/hooks/useConfig';
import useDocumentTitle from '@proton/components/hooks/useDocumentTitle';
import {getAppShortName} from '@proton/shared/lib/apps/helper';
import {ThemeTypes} from '@proton/shared/lib/themes/constants';

import {LUMO_FULL_APP_TITLE} from '../../constants';
import {
    getLumoThemeFromSettings,
    getThemeConfig,
    matchDarkTheme,
    getDefaultSettings,
    getLumoSettings
} from '../../providers';
import animationData from '../Animations/loader.json';

interface Props {
    documentTitle?: string;
    text?: string;
}

const LumoLoader = ({documentTitle = '', text}: Props) => {
    const {APP_NAME} = useConfig();

    const appName = getAppShortName(APP_NAME);
    const textToDisplay = text || c('Info').t`Loading ${appName}`;

    useDocumentTitle(documentTitle || LUMO_FULL_APP_TITLE);

    // Since loader is outside of Store Provider, check local storage for theme settings to update loader background
    const themeConfig = useMemo(() => {
        try {
            const localSettings = getLumoSettings() || getDefaultSettings();
            const systemIsDark = matchDarkTheme().matches;
            const currentTheme = getLumoThemeFromSettings(localSettings, systemIsDark);

            return {
                theme: currentTheme,
                isDark: currentTheme === ThemeTypes.LumoDark,
                styles: getThemeConfig(currentTheme).styles,
            };
        } catch {
            // Fallback to system preference if there's any error
            const systemIsDark = matchDarkTheme().matches;
            const fallbackTheme = systemIsDark ? ThemeTypes.LumoDark : ThemeTypes.LumoLight;
            return {
                theme: fallbackTheme,
                isDark: systemIsDark,
                styles: getThemeConfig(fallbackTheme).styles,
            };
        }
    }, []);

    const preventDefaultEvent = (e: SyntheticEvent) => e.preventDefault();

    return (
        <>
            {/* Inject theme styles for the loader */}
            <style>{themeConfig.styles}</style>
            <div
                className="loader-page h-full lumo-loader-bg lumo-color-primary"
                // Ignore drag & drop during loading to avoid issue when user drops
                // file too soon before the app is ready causing stop of the app
                // load and showing the file instead.
                onDragOver={preventDefaultEvent}
                onDragEnter={preventDefaultEvent}
                onDragEnd={preventDefaultEvent}
                onDrop={preventDefaultEvent}
            >
                <div className="absolute inset-center text-center">
                    {/* <LazyLottie getAnimationData={lumoLoader} loop={true} style={{ width: 180 }} /> */}
                    <Lottie animationData={animationData} loop={true} style={{width: 180}}/>
                    <TextLoader className="color-weak ml-5">{textToDisplay}</TextLoader>
                </div>
            </div>
        </>
    );
};

export default LumoLoader;
