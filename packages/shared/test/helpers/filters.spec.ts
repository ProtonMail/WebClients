import { Filter } from '@proton/components/containers/filters/interfaces';
import { FILTER_STATUS } from '@proton/shared/lib/constants';
import { hasReachedFiltersLimit } from '@proton/shared/lib/helpers/filters';
import { UserModel } from '@proton/shared/lib/interfaces';

describe('filters helpers', () => {
    it('should have reached filters limit on free user', () => {
        const user = { hasPaidMail: false } as UserModel;
        const filters: Filter[] = [{ Status: FILTER_STATUS.ENABLED } as Filter];

        expect(hasReachedFiltersLimit(user, filters)).toBeTruthy();
    });

    it('should not have reached filters limit on free user when no filters', () => {
        const user = { hasPaidMail: false } as UserModel;
        const filters: Filter[] = [];

        expect(hasReachedFiltersLimit(user, filters)).toBeFalsy();
    });

    it('should not have reached filters limit on free user when filters are disabled', () => {
        const user = { hasPaidMail: false } as UserModel;
        const filters: Filter[] = [
            { Status: FILTER_STATUS.DISABLED } as Filter,
            { Status: FILTER_STATUS.DISABLED } as Filter,
        ];

        expect(hasReachedFiltersLimit(user, filters)).toBeFalsy();
    });

    it('should not have reached filters limit on paid user', () => {
        const user = { hasPaidMail: true } as UserModel;
        const filters: Filter[] = [
            { Status: FILTER_STATUS.ENABLED } as Filter,
            { Status: FILTER_STATUS.ENABLED } as Filter,
            { Status: FILTER_STATUS.ENABLED } as Filter,
            { Status: FILTER_STATUS.DISABLED } as Filter,
        ];

        expect(hasReachedFiltersLimit(user, filters)).toBeFalsy();
    });
});
