import { Page } from '../models/tools';

export const pageCount = (page: Page) => Math.ceil(page.total / page.size) || 0;

export const expectedPageLength = (page: Page) => {
    if (page.total === 0) {
        return 0;
    }
    const count = pageCount(page);
    if (page.page >= count) {
        return 0;
    }
    if (page.total % page.size === 0) {
        return page.size;
    }
    if (count - 1 === page.page) {
        return page.total % page.size;
    }
    return page.size;
};
