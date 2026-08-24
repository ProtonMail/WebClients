import type { EnvironmentExtended } from '../interfaces';
import type { SpotlightDate } from './interface';

export const getEnvironmentDate = (
    currentEnvironment: EnvironmentExtended | undefined,
    spotlightDates: SpotlightDate
) => {
    if (currentEnvironment) {
        const environmentDate = spotlightDates[currentEnvironment];
        if (environmentDate !== undefined) {
            return environmentDate;
        }
    }
    return spotlightDates.default;
};
