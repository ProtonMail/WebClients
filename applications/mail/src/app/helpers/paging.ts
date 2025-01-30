import type { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';

export const pageCount = (total: number, pageSize: MAIL_PAGE_SIZE) => Math.ceil(total / pageSize) || 0;

export const expectedPageLength = (
    page: number,
    pageSize: MAIL_PAGE_SIZE,
    inputTotal: number,
    filterBypassCount: number
) => {
    const total = inputTotal + filterBypassCount;

    if (total === 0) {
        return 0;
    }
    const count = pageCount(total, pageSize);

    if (page >= count) {
        return 0;
    }

    if (total % pageSize === 0) {
        return pageSize;
    }

    if (count - 1 === page) {
        return total % pageSize;
    }

    return pageSize;
};

export const isPageConsecutive = (pages: number[], destinationPage: number) => {
    return (
        pages.length === 0 ||
        pages.some((p) => p === destinationPage || p === destinationPage - 1 || p === destinationPage + 1)
    );
};
