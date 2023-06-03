import { c } from 'ttag';

import { ThemeModeSetting, ThemeTypes } from '@proton/shared/lib/themes/themes';

import { Info, Toggle } from '../../components';
import ThemeCards, { Theme } from '../themes/ThemeCards';
import { useThemeSetting } from '../themes/ThemeSettingProvider';
import ThemeSyncModeCard from '../themes/ThemeSyncModeCard';
import OnboardingContent, { Props as OnboardingContentProps } from './OnboardingContent';

interface Props extends Omit<OnboardingContentProps, 'decription' | 'onChange'> {
    themes: Theme[];
    themeIdentifier: ThemeTypes;
    onChange: (identifier: ThemeTypes) => void;
}

const OnboardingThemes = ({ themes, themeIdentifier, onChange, ...rest }: Props) => {
    const { settings, setTheme, setAutoTheme } = useThemeSetting();

    return (
        <OnboardingContent
            title={c('Onboarding Proton').t`Select a theme`}
            description={c('Onboarding Proton')
                .t`You can change this anytime in your settings. Select a single theme, or sync with your system.`}
            {...rest}
        >
            <div className="inline-flex flex-align-item-center mb-4 gap-4">
                <label htmlFor="themeSyncToggle" className="text-semibold">
                    <span className="mr-2">{c('Label').t`Synchronize with system`}</span>
                    <Info
                        title={c('Tooltip')
                            .t`Automatically switch between your preferred themes for day and night in sync with your system’s day and night modes`}
                    />
                </label>
                <Toggle
                    id="themeSyncToggle"
                    checked={settings.mode === ThemeModeSetting.Auto}
                    onChange={(e) => setAutoTheme(e.target.checked)}
                />
            </div>
            {settings.mode === ThemeModeSetting.Auto ? (
                <>
                    <ThemeSyncModeCard
                        className="mb-4"
                        mode="light"
                        size="small"
                        list={themes}
                        themeIdentifier={settings.lightTheme}
                        onChange={(themeType) => {
                            setTheme(themeType, ThemeModeSetting.Light);
                        }}
                        active={settings.colorScheme === ThemeModeSetting.Light}
                    />
                    <ThemeSyncModeCard
                        mode="dark"
                        size="small"
                        list={themes}
                        themeIdentifier={settings.darkTheme}
                        onChange={(themeType) => {
                            setTheme(themeType, ThemeModeSetting.Dark);
                        }}
                        active={settings.colorScheme === ThemeModeSetting.Dark}
                    />
                </>
            ) : (
                <ThemeCards
                    list={themes}
                    themeIdentifier={themeIdentifier}
                    onChange={(themeType) => {
                        setTheme(themeType);
                    }}
                />
            )}
        </OnboardingContent>
    );
};

export default OnboardingThemes;
