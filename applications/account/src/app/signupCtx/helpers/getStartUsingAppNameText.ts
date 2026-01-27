import { c } from 'ttag';

/**
 * Returns the translated text for the "Start using {appName} now" button text
 * @param appName - The name of the app (e.g., "Proton Mail", "Proton Drive", etc.)
 * @returns The translated string
 */
export const getStartUsingAppNameText = (appName: string): string => {
    return c('pass_signup_2023: Action').t`Start using ${appName} now`;
};
