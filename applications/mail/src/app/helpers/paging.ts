import { PAGE_SIZE } from '../constants';

export const pageCount = (total: number) => Math.ceil(total / PAGE_SIZE) || 0;

export const expectedPageLength = (page: number, inputTotal: number, filterBypassCount: number) => {
    const total = inputTotal + filterBypassCount;

    if (total === 0) {
        return 0;
    }
    const count = pageCount(total);
    if (page >= count) {
        return 0;
    }
    if (total % PAGE_SIZE === 0) {
        return PAGE_SIZE;
    }
    if (count - 1 === page) {
        return total % PAGE_SIZE;
    }
    return PAGE_SIZE;
};
