import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { ThemeModeSetting } from '@proton/shared/lib/themes/constants';

const publicThemeStorageKey = 'theme';

export const getThemeModeFromStorage = (): ThemeModeSetting | undefined => {
    const value = getItem(publicThemeStorageKey);
    if (value == null) {
        return undefined;
    }
    const stored = Number(value);
    switch (stored) {
        case ThemeModeSetting.Light:
        case ThemeModeSetting.Dark:
        case ThemeModeSetting.Auto:
            return stored;
    }
};

export const setThemeModeToStorage = (themeModeSetting: ThemeModeSetting) => {
    setItem(publicThemeStorageKey, `${themeModeSetting}`);
};
