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

/**
 * Get the text for the plan or app name
 * In order avoid duplicate translations, we use this function to get the text for the plan or app name
 * @param planOrAppName - The name of the plan or app
 * @returns The text for the plan or app name
 * @example
 * goToPlanOrAppNameText('Drive') // Displays: 'Go to Drive'
 * goToPlanOrAppNameText('Mail Plus') // Displays: 'Go to Mail Plus'
 */
export const goToPlanOrAppNameText = (planOrAppName: string) => {
    return c('Action').t`Go to ${planOrAppName}`;
};

/**
 * Get the text for the plan or app name
 * In order avoid duplicate translations, we use this function to get the text for the plan or app name
 * @param planOrAppName - The name of the plan or app
 * @returns The text for the plan or app name
 * @example
 * selectPlanOrAppNameText('Drive') // Displays: 'Select Drive'
 * selectPlanOrAppNameText('Mail Plus') // Displays: 'Select Mail Plus'
 */
export const selectPlanOrAppNameText = (planOrAppName: string) => {
    return c('Action').t`Select ${planOrAppName}`;
};

/**
 * Get the text for the plan or app name
 * In order avoid duplicate translations, we use this function to get the text for the plan or app name
 * @param planOrAppName - The name of the plan or app
 * @returns The text for the plan or app name
 * @example
 * everythingInPlanOrAppNameText('Drive') // Displays: 'Select Drive'
 * everythingInPlanOrAppNameText('Mail Plus') // Displays: 'Select Mail Plus'
 */
export const everythingInPlanOrAppNameText = (planOrAppName: string) => {
    return c('Info').t`Everything in ${planOrAppName}`;
};

/**
 * Get the "Everything in X, plus:" text for plan upsell descriptions
 * @param planOrAppName - The name of the plan or app
 * @returns The text for the plan or app name
 * @example
 * everythingInPlanOrAppNamePlusText('Mail Essentials') // Displays: 'Everything in Mail Essentials, plus:'
 */
export const everythingInPlanOrAppNamePlusText = (planOrAppName: string) => {
    return c('Info').t`Everything in ${planOrAppName}, plus:`;
};

/**
 * Get the text for the plan or app name
 * In order avoid duplicate translations, we use this function to get the text for the plan or app name
 * @param planOrAppName - The name of the plan or app
 * @returns The text for the plan or app name
 * @example
 * goToPlanOrAppNameText('Drive') // Displays: 'Continue to Drive'
 * goToPlanOrAppNameText('Mail Plus') // Displays: 'Continue to Mail Plus'
 */
export const continueToPlanOrAppNameText = (planOrAppName: string) => {
    return c('Action').t`Continue to ${planOrAppName}`;
};
