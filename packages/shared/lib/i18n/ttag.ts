import { c } from 'ttag';

/**
 * Get the text for the plan or app name
 * In order avoid duplicate translations, we use this function to get the text for the plan or app name
 * @param planOrAppName - The name of the plan or app
 * @returns The text for the plan or app name
 * @example
 * getPlanOrAppNameText('Drive') // Displays: 'Get Drive'
 * getPlanOrAppNameText('Mail Plus') // Displays: 'Get Mail Plus'
 */
export const getPlanOrAppNameText = (planOrAppName: string) => {
    return c('Action').t`Get ${planOrAppName}`;
};
