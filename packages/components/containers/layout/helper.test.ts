import { SubSectionConfig } from '.';
import { getIsSubsectionAvailable } from './helper';

describe('getIsSubsectionAvailable', () => {
    it('returns true when `available` is undefined', () => {
        const config: SubSectionConfig = {
            id: '',
        };

        const result = getIsSubsectionAvailable(config);

        expect(result).toBe(true);
    });

    it('returns true when `available` is true', () => {
        const config: SubSectionConfig = {
            id: '',
            available: true,
        };

        const result = getIsSubsectionAvailable(config);

        expect(result).toBe(true);
    });

    it('returns false when `available` is false', () => {
        const config: SubSectionConfig = {
            id: '',
            available: false,
        };

        const result = getIsSubsectionAvailable(config);

        expect(result).toBe(false);
    });
});
