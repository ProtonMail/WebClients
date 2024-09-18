import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { ColorScheme, ThemeModeSetting, getThemes } from '@proton/shared/lib/themes/themes';

import type { ModalProps } from '../../components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../components';
import ThemeCards from './ThemeCards';
import { useTheme } from './ThemeProvider';
import ThemeSyncModeCard from './ThemeSyncModeCard';

const ThemesModal = (props: ModalProps) => {
    const { information, settings, setTheme, setAutoTheme } = useTheme();

    const themes = getThemes();

    return (
        <ModalTwo size="large" {...props}>
            <ModalTwoHeader title={c('Title').t`Select a theme`} />
            <ModalTwoContent>
                <p className="mb-4">{c('Info').t`Customize the look and feel of ${BRAND_NAME} applications.`}</p>
                <div className="inline-flex mb-4">
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
                        checked={settings.Mode === ThemeModeSetting.Auto}
                        onChange={(e) => setAutoTheme(e.target.checked)}
                    />
                </div>
                {settings.Mode === ThemeModeSetting.Auto ? (
                    <div className="flex flex-nowrap gap-4 flex-column md:flex-row">
                        <ThemeSyncModeCard
                            className="md:flex-1"
                            mode="light"
                            size="small"
                            list={themes}
                            themeIdentifier={settings.LightTheme}
                            onChange={(themeType) => {
                                setTheme(themeType, ThemeModeSetting.Light);
                            }}
                            active={information.colorScheme === ColorScheme.Light}
                        />
                        <ThemeSyncModeCard
                            className="md:flex-1"
                            mode="dark"
                            size="small"
                            list={themes}
                            themeIdentifier={settings.DarkTheme}
                            onChange={(themeType) => {
                                setTheme(themeType, ThemeModeSetting.Dark);
                            }}
                            active={information.colorScheme === ColorScheme.Dark}
                        />
                    </div>
                ) : (
                    <ThemeCards
                        list={themes}
                        themeIdentifier={information.theme}
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
