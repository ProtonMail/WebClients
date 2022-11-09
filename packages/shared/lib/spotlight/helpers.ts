import { Environment } from '@proton/shared/lib/environment/helper';
import { SpotlightDate } from '@proton/shared/lib/spotlight/interface';

export const getEnvironmentDate = (
    currentEnvironment: Environment | 'default' | undefined,
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
