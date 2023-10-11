import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';

import { expectedPageLength, pageCount } from './paging';

describe('paging helper', () => {
    describe('pageCount', () => {
        it('should be 1 when total is less than size', () => {
            expect(pageCount(10, MAIL_PAGE_SIZE.FIFTY)).toBe(1);
        });

        it('should be the number of pages the user can see', () => {
            expect(pageCount(125, MAIL_PAGE_SIZE.FIFTY)).toBe(3);
        });
    });

    describe('expectedPageLength', () => {
        it('should be 0 if total is 0', () => {
            expect(expectedPageLength(0, MAIL_PAGE_SIZE.FIFTY, 0, 0)).toBe(0);
        });

        it('should be size if total is a multiple of the size', () => {
            expect(expectedPageLength(0, MAIL_PAGE_SIZE.FIFTY, 150, 0)).toBe(50);
        });

        it('should be the rest on last page', () => {
            expect(expectedPageLength(2, MAIL_PAGE_SIZE.FIFTY, 125, 0)).toBe(25);
        });

        it('should be the size if not last page', () => {
            expect(expectedPageLength(1, MAIL_PAGE_SIZE.FIFTY, 125, 0)).toBe(50);
        });

        it('should be 0 if page is after the total', () => {
            expect(expectedPageLength(2, MAIL_PAGE_SIZE.FIFTY, 100, 0)).toBe(0);
        });

        it('should deal with bypass filter when less than a page', () => {
            expect(expectedPageLength(0, MAIL_PAGE_SIZE.FIFTY, 25, 2)).toBe(27);
        });

        it('should deal with bypass filter even if there is no more elements', () => {
            expect(expectedPageLength(0, MAIL_PAGE_SIZE.FIFTY, 0, 2)).toBe(2);
        });

        it('should deal with bypass filter in a middle of a list', () => {
            expect(expectedPageLength(1, MAIL_PAGE_SIZE.FIFTY, 125, 2)).toBe(50);
        });

        it('should deal with bypass filter in the last page', () => {
            expect(expectedPageLength(2, MAIL_PAGE_SIZE.FIFTY, 125, 2)).toBe(27);
        });

        it('should deal with bypass filter if it changes the page cont', () => {
            expect(expectedPageLength(0, MAIL_PAGE_SIZE.FIFTY, 40, 20)).toBe(50);
        });

        it("should deal with bypass filter if it's huge", () => {
            expect(expectedPageLength(0, MAIL_PAGE_SIZE.FIFTY, 20, 60)).toBe(50);
        });
    });
});
