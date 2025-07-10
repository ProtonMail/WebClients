import { hasCategoryLabel, isLabelIDCaregoryKey } from './categoryViewHelpers';

describe('categoryViewHelpers', () => {
    describe('isLabelIDCaregoryKey', () => {
        it('should return true if the labelID is a category key', () => {
            expect(isLabelIDCaregoryKey('20')).toBe(true);
        });

        it('should return false if the labelID is not a category key', () => {
            expect(isLabelIDCaregoryKey('1')).toBe(false);
        });
    });

    describe('hasCategoryLabel', () => {
        it('should return true if the labelIDs contains a category key', () => {
            expect(hasCategoryLabel(['20', '1'])).toBe(true);
        });

        it('should return false if the labelIDs does not contain a category key', () => {
            expect(hasCategoryLabel(['1'])).toBe(false);
        });

        it('should return false if the labelIDs is undefined', () => {
            expect(hasCategoryLabel(undefined)).toBe(false);
        });

        it('should return false if the labelIDs is empty', () => {
            expect(hasCategoryLabel([])).toBe(false);
        });
    });
});
