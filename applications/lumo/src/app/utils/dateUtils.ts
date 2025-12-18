import { isAfter } from 'date-fns';

/**
 * Checks if the current date is after December 29, 2025
 * This determines when to show New Year's variants instead of Christmas variants for Themed Lumo Cat
 */
export const isNewYearsSeason = (): boolean => {
    const newYearsStartDate = new Date('2025-12-29');
    return isAfter(new Date(), newYearsStartDate);
};
