import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import * as sorting from './sorting';

describe('sorting', () => {
    it('should return SortSetting identifier given SortParams', () => {
        expect(sorting.getSetting({ sortField: 'name', sortOrder: SORT_DIRECTION.DESC })).toBe(-1);
        expect(sorting.getSetting({ sortField: 'size', sortOrder: SORT_DIRECTION.ASC })).toBe(2);
        expect(sorting.getSetting({ sortField: 'mimeType', sortOrder: SORT_DIRECTION.DESC })).toBe(-3);
        expect(sorting.getSetting({ sortField: 'fileModifyTime', sortOrder: SORT_DIRECTION.ASC })).toBe(4);
    });

    it('should return SortParams given SortSetting identifier', () => {
        expect(sorting.parseSetting(1)).toEqual({
            sortField: 'name',
            sortOrder: SORT_DIRECTION.ASC,
        });
        expect(sorting.parseSetting(-2)).toEqual({
            sortField: 'size',
            sortOrder: SORT_DIRECTION.DESC,
        });
        expect(sorting.parseSetting(3)).toEqual({
            sortField: 'mimeType',
            sortOrder: SORT_DIRECTION.ASC,
        });
        expect(sorting.parseSetting(-4)).toEqual({
            sortField: 'fileModifyTime',
            sortOrder: SORT_DIRECTION.DESC,
        });
    });
});
