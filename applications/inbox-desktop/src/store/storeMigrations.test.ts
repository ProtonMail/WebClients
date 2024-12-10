import { ThemeModeSetting, ThemeSetting, ThemeTypes } from "@proton/shared/lib/themes/themes";
import { getSettings, updateSettings } from "../store/settingsStore";
import { performStoreMigrations } from "./storeMigrations";

jest.mock("../store/settingsStore", () => ({
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
}));

const getSettingsMock = getSettings as jest.MockedFn<typeof getSettings>;
const updateSettingsMock = updateSettings as jest.MockedFn<typeof updateSettings>;

const setThemeMock = (theme: Partial<ThemeSetting>) => {
    getSettingsMock.mockReturnValue({
        theme,
        spellChecker: false,
        overrideError: false,
    });
};

updateSettingsMock.mockImplementation((update) => {
    getSettingsMock.mockReturnValue({
        ...getSettingsMock(),
        ...update,
    });
});

describe("storeMigrations", () => {
    describe("forceDarkAndLightThemes", () => {
        it("forces snow as light theme", () => {
            setThemeMock({ LightTheme: ThemeTypes.Carbon });
            performStoreMigrations();
            expect(updateSettings).toHaveBeenCalledWith({ theme: { LightTheme: ThemeTypes.Snow } });
        });

        it("forces carbon as dark theme", () => {
            setThemeMock({ DarkTheme: ThemeTypes.Snow });
            performStoreMigrations();
            expect(updateSettings).toHaveBeenCalledWith({ theme: { DarkTheme: ThemeTypes.Carbon } });
        });

        it("sets light mode if snow is selected for light and dark schemes and mode is undefined", () => {
            setThemeMock({ LightTheme: ThemeTypes.Snow, DarkTheme: ThemeTypes.Snow });
            performStoreMigrations();
            expect(updateSettings).toHaveBeenCalledWith({
                theme: { Mode: ThemeModeSetting.Light, LightTheme: ThemeTypes.Snow, DarkTheme: ThemeTypes.Carbon },
            });
        });

        it("sets dark mode if carbon is selected for light and dark schemes and mode is undefined", () => {
            setThemeMock({ LightTheme: ThemeTypes.Carbon, DarkTheme: ThemeTypes.Carbon });
            performStoreMigrations();
            expect(updateSettings).toHaveBeenCalledWith({
                theme: { Mode: ThemeModeSetting.Dark, LightTheme: ThemeTypes.Snow, DarkTheme: ThemeTypes.Carbon },
            });
        });

        it("sets light mode if snow is selected for light and dark schemes and mode is auto", () => {
            setThemeMock({ Mode: ThemeModeSetting.Auto, LightTheme: ThemeTypes.Snow, DarkTheme: ThemeTypes.Snow });
            performStoreMigrations();
            expect(updateSettings).toHaveBeenCalledWith({
                theme: { Mode: ThemeModeSetting.Light, LightTheme: ThemeTypes.Snow, DarkTheme: ThemeTypes.Carbon },
            });
        });

        it("sets dark mode if carbon is selected for light and dark schemes and mode is auto", () => {
            setThemeMock({ Mode: ThemeModeSetting.Auto, LightTheme: ThemeTypes.Carbon, DarkTheme: ThemeTypes.Carbon });
            performStoreMigrations();
            expect(updateSettings).toHaveBeenCalledWith({
                theme: { Mode: ThemeModeSetting.Dark, LightTheme: ThemeTypes.Snow, DarkTheme: ThemeTypes.Carbon },
            });
        });

        it("does nothing if mode is auto and themes are ok", () => {
            setThemeMock({ Mode: ThemeModeSetting.Auto, LightTheme: ThemeTypes.Snow, DarkTheme: ThemeTypes.Carbon });
            performStoreMigrations();
            expect(updateSettings).not.toHaveBeenCalled();
        });

        it("does nothing if mode is light and themes are ok", () => {
            setThemeMock({ Mode: ThemeModeSetting.Light, LightTheme: ThemeTypes.Snow, DarkTheme: ThemeTypes.Carbon });
            performStoreMigrations();
            expect(updateSettings).not.toHaveBeenCalled();
        });

        it("does nothing if mode is dark and themes are ok", () => {
            setThemeMock({ Mode: ThemeModeSetting.Light, LightTheme: ThemeTypes.Snow, DarkTheme: ThemeTypes.Carbon });
            performStoreMigrations();
            expect(updateSettings).not.toHaveBeenCalled();
        });

        it("works if multiple theme settings are messed up", () => {
            setThemeMock({ Mode: ThemeModeSetting.Auto, LightTheme: ThemeTypes.Carbon, DarkTheme: ThemeTypes.Snow });
            performStoreMigrations();
            expect(updateSettings).toHaveBeenCalledWith({
                theme: { Mode: ThemeModeSetting.Auto, LightTheme: ThemeTypes.Snow, DarkTheme: ThemeTypes.Carbon },
            });
        });
    });
});
