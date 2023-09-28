import { MailPageSize } from '@proton/shared/lib/interfaces';

export const pageCount = (total: number, pageSize: MailPageSize) => Math.ceil(total / pageSize) || 0;

export const expectedPageLength = (
    page: number,
    pageSize: MailPageSize,
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
