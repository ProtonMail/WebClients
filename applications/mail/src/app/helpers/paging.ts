import { Page } from '../models/tools';

export const pageCount = (page: Page) => Math.ceil(page.total / page.size);

export const expectedPageLength = (page: Page) => {
    if (page.total === 0) {
        return 0;
    }
    if (page.total % page.size === 0) {
        return page.size;
    }
    if (pageCount(page) - 1 === page.page) {
        return page.total % page.size;
    }
    return page.size;
};
