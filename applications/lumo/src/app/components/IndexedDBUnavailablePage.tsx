import { useMemo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useDocumentTitle from '@proton/components/hooks/useDocumentTitle';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';
import lumoCatAlert from '@proton/styles/assets/img/lumo/lumo-cat-alert.svg';

import {
    getDefaultSettings,
    getLumoSettings,
    getLumoThemeFromSettings,
    getThemeConfig,
    matchDarkTheme,
} from '../providers';
import {LUMO_SHORT_APP_NAME} from "@proton/shared/lib/constants.ts";

/**
 * Full-page screen shown when IndexedDB is unavailable and Lumo cannot start.
 *
 * This typically happens on iOS Safari when website data is blocked
 * ("Block All Cookies"), in private browsing, or with Lockdown Mode enabled.
 * It is rendered outside the Redux store, so it derives the theme from local
 * storage the same way {@link LumoLoader} does.
 */
const IndexedDBUnavailablePage = () => {
    useDocumentTitle(LUMO_SHORT_APP_NAME);

    const themeConfig = useMemo(() => {
        try {
            const localSettings = getLumoSettings() || getDefaultSettings();
            const systemIsDark = matchDarkTheme().matches;
            const currentTheme = getLumoThemeFromSettings(localSettings, systemIsDark);

            return { styles: getThemeConfig(currentTheme).styles };
        } catch {
            const systemIsDark = matchDarkTheme().matches;
            const fallbackTheme = systemIsDark ? ThemeTypes.LumoDark : ThemeTypes.LumoLight;
            return { styles: getThemeConfig(fallbackTheme).styles };
        }
    }, []);

    return (
        <>
            <style>{themeConfig.styles}</style>
            <div className="loader-page h-full lumo-loader-bg lumo-color-primary">
                <div
                    className="absolute inset-center text-center flex flex-column items-center flex-nowrap gap-4 max-w-custom px-4"
                    style={{ '--max-w-custom': '30rem' }}
                >
                    <span className="rounded-full p-4 inline-flex" aria-hidden="true">
                        <img className="h-custom w-custom" src={lumoCatAlert} alt="" />
                    </span>

                    <h1 className="text-bold text-2xl mt-2">{c('collider_2025:Title')
                        .t`${LUMO_SHORT_APP_NAME} can't start`}</h1>

                    <p className="color-weak m-0">{c('collider_2025:Info')
                        .t`${LUMO_SHORT_APP_NAME} needs local database storage (IndexedDB) to keep your conversations on this device, but it isn't available here.`}</p>

                    <div className="text-left bg-weak rounded-lg p-4 w-full">
                        <p className="text-sm text-semibold mt-0 mb-2">{c('collider_2025:Info')
                            .t`This usually happens when:`}</p>
                        <ul className="m-0 pl-5 color-weak text-sm flex flex-column gap-1">
                            <li>{c('collider_2025:Info')
                                .t`Cookies or website data are blocked in your browser settings`}</li>
                            <li>{c('collider_2025:Info').t`You're using private browsing`}</li>
                            <li>{c('collider_2025:Info').t`Lockdown Mode is enabled on your device`}</li>
                        </ul>
                    </div>

                    <p className="color-weak text-sm m-0">{c('collider_2025:Info')
                        .t`On iPhone or iPad, open Settings → Apps → Safari and make sure "Block All Cookies" is turned off, then reload.`}</p>

                    <div className="mt-2">
                        <Button color="norm" onClick={() => window.location.reload()}>
                            <IcArrowRotateRight className="mr-2" />
                            <span>{c('Action').t`Reload`}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default IndexedDBUnavailablePage;
