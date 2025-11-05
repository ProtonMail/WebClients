import { nativeTheme } from "electron";
import { PROTON_THEMES_MAP } from "@proton/shared/lib/themes/themes";
import { getMainWindow } from "./view/viewManagement";
import { ThemeTypes } from "@proton/shared/lib/themes/constants";

// Meet uses a hard-coded dark theme
export function initializeDarkTheme() {
    // Force dark theme
    nativeTheme.themeSource = "dark";

    const mainWindow = getMainWindow();
    if (!mainWindow.isDestroyed()) {
        // Use Carbon dark theme color for window background
        const themeColors = PROTON_THEMES_MAP[ThemeTypes.Carbon];
        mainWindow.setBackgroundColor(themeColors.themeColorMeta);
    }
}
