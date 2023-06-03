import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_APPS, DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { PROTON_THEMES, ThemeModeSetting } from '@proton/shared/lib/themes/themes';

import { Info, ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, Toggle } from '../../components';
import { useDrawer } from '../../hooks';
import ThemeCards from './ThemeCards';
import { useThemeSetting } from './ThemeSettingProvider';
import ThemeSyncModeCard from './ThemeSyncModeCard';

const ThemesModal = (props: ModalProps) => {
    const { settings, setTheme, setAutoTheme } = useThemeSetting();
    const { iframeSrcMap } = useDrawer();

    useEffect(() => {
        // TODO: Improve / Check this
        // If the drawer is open, we need to make the app inside the iframe to call the event manager
        // Otherwise, the theme is not updated before the next event manager call
        if (iframeSrcMap) {
            Object.keys(iframeSrcMap).map((app) => {
                postMessageToIframe(
                    { type: DRAWER_EVENTS.UPDATE_THEME, payload: { theme: settings.currentTheme } },
                    app as DRAWER_APPS
                );
            });
        }
    }, [settings.currentTheme]);

    return (
        <ModalTwo size="large" {...props}>
            <ModalTwoHeader title={c('Title').t`Select a theme`} />
            <ModalTwoContent>
                <p className="mb-4">{c('Info').t`Customize the look and feel of ${BRAND_NAME} applications.`}</p>
                <div className="inline-flex flex-align-item-center mb-4">
                    <label htmlFor="themeSyncToggle" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Synchronize with system`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Automatically switch between your preferred themes for day and night in sync with your system’s day and night modes`}
                        />
                    </label>
                    <Toggle
                        id="themeSyncToggle"
                        className="ml-6"
                        checked={settings.mode === ThemeModeSetting.Auto}
                        onChange={(e) => setAutoTheme(e.target.checked)}
                    />
                </div>
                {settings.mode === ThemeModeSetting.Auto ? (
                    <div className="flex flex-nowrap gap-4 on-mobile-flex-column">
                        <ThemeSyncModeCard
                            mode="light"
                            size="small"
                            list={PROTON_THEMES}
                            themeIdentifier={settings.lightTheme}
                            onChange={(themeType) => {
                                setTheme(themeType, ThemeModeSetting.Light);
                            }}
                            active={settings.colorScheme === ThemeModeSetting.Light}
                        />
                        <ThemeSyncModeCard
                            mode="dark"
                            size="small"
                            list={PROTON_THEMES}
                            themeIdentifier={settings.darkTheme}
                            onChange={(themeType) => {
                                setTheme(themeType, ThemeModeSetting.Dark);
                            }}
                            active={settings.colorScheme === ThemeModeSetting.Dark}
                        />
                    </div>
                ) : (
                    <ThemeCards
                        list={PROTON_THEMES}
                        themeIdentifier={settings.currentTheme}
                        onChange={(themeType) => {
                            setTheme(themeType);
                        }}
                    />
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="norm" className="ml-auto" onClick={props.onClose}>{c('Action').t`OK`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ThemesModal;
