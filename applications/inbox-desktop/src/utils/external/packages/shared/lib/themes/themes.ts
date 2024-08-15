export enum ThemeTypes {
    Carbon = 1,
    Snow = 2,
}

export enum ThemeModeSetting {
    Auto,
    Dark,
    Light,
}

export enum ThemeFontSizeSetting {
    DEFAULT = 0,
    X_SMALL,
    SMALL,
    LARGE,
    X_LARGE,
}
export enum ThemeFontFaceSetting {
    DEFAULT,
    SYSTEM,
    ARIAL,
    TIMES,
    DYSLEXIC,
}
export enum ThemeFeatureSetting {
    DEFAULT,
    SCROLLBARS_OFF,
    ANIMATIONS_OFF,
}

export interface ThemeSetting {
    Mode: ThemeModeSetting;
    LightTheme: ThemeTypes;
    DarkTheme: ThemeTypes;
    // FontSize: ThemeFontSizeSetting;
    // FontFace: ThemeFontFaceSetting;
    // Features: ThemeFeatureSetting;
}
