import { PAGE_SIZE } from '../constants';

export const pageCount = (total: number) => Math.ceil(total / PAGE_SIZE) || 0;

export const expectedPageLength = (page: number, total: number, filterBypassCount: number) => {
    if (total === 0) {
        return filterBypassCount;
    }
    const count = pageCount(total);
    if (page >= count) {
        return 0;
    }
    if (total % PAGE_SIZE === 0) {
        return PAGE_SIZE;
    }
    if (count - 1 === page) {
        return (total % PAGE_SIZE) + filterBypassCount;
    }
    return PAGE_SIZE;
};
