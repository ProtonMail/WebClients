/**
 * CSS selectors used by mobile clients (iOS, Android) to interact with the web app via JavaScript bridges.
 *
 * IMPORTANT: Do not rename or remove these classes without updating the corresponding mobile apps.
 * Changing these selectors will silently break native app functionality.
 */
export const MobileSelectors = {
    /** Theme selection button in appearance settings. Used by iOS/Android to detect theme changes. */
    themeButton: 'lumo-theme-card-button',
} as const;
