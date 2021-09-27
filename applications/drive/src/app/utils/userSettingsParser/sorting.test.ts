import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import userSettingsParser from './userSettingsParser';

describe('userSettingsParser', () => {
    describe('sorting()', () => {
        it('should return SortSetting identifier given SortParams', () => {
            expect(userSettingsParser.sorting.getSetting({ sortField: 'Name', sortOrder: SORT_DIRECTION.DESC })).toBe(
                -1
            );
            expect(userSettingsParser.sorting.getSetting({ sortField: 'Size', sortOrder: SORT_DIRECTION.ASC })).toBe(2);
            expect(
                userSettingsParser.sorting.getSetting({ sortField: 'MIMEType', sortOrder: SORT_DIRECTION.DESC })
            ).toBe(-3);
        });
        it('should return SortParams given SortSetting identifier', () => {
            expect(userSettingsParser.sorting.parseSetting(1)).toEqual({
                sortField: 'Name',
                sortOrder: SORT_DIRECTION.ASC,
            });
            expect(userSettingsParser.sorting.parseSetting(3)).toEqual({
                sortField: 'MIMEType',
                sortOrder: SORT_DIRECTION.ASC,
            });
            expect(userSettingsParser.sorting.parseSetting(-4)).toEqual({
                sortField: 'ModifyTime',
                sortOrder: SORT_DIRECTION.DESC,
            });
        });
    });
});
