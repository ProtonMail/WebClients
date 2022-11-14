import { getEnvironmentDate } from '@proton/shared/lib/spotlight/helpers';
import { SpotlightDate } from '@proton/shared/lib/spotlight/interface';

describe('Spotlight', () => {
    describe('getEnvironmentDate', () => {
        const defaultDate = Date.UTC(2022, 1, 1, 12);
        const betaDate = Date.UTC(2023, 1, 1, 12);
        const alphaDate = Date.UTC(2024, 1, 1, 12);

        const dates: SpotlightDate = {
            default: defaultDate,
            beta: betaDate,
            alpha: alphaDate,
        };

        it('should return the expected dates depending on the current environement', () => {
            expect(getEnvironmentDate(undefined, dates)).toBe(defaultDate);
            expect(getEnvironmentDate('default', dates)).toBe(defaultDate);
            expect(getEnvironmentDate('beta', dates)).toBe(betaDate);
            expect(getEnvironmentDate('alpha', dates)).toBe(alphaDate);
        });
    });
});
