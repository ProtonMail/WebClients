import { expectedPageLength, pageCount } from './paging';

describe('paging helper', () => {
    describe('pageCount', () => {
        it('should be 1 when total is less than size', () => {
            expect(pageCount({ total: 10, page: 0, size: 50 })).toBe(1);
        });

        it('should be the number of pages the user can see', () => {
            expect(pageCount({ total: 125, page: 1, size: 50 })).toBe(3);
        });
    });

    describe('expectedPageLength', () => {
        it('should be 0 if total is 0', () => {
            expect(expectedPageLength({ total: 0, page: 0, size: 50 })).toBe(0);
        });

        it('should be size if total is a multiple of the size', () => {
            expect(expectedPageLength({ total: 150, page: 0, size: 50 })).toBe(50);
        });

        it('should be the rest on last page', () => {
            expect(expectedPageLength({ total: 125, page: 2, size: 50 })).toBe(25);
        });

        it('should be the size if not last page', () => {
            expect(expectedPageLength({ total: 125, page: 1, size: 50 })).toBe(50);
        });

        it('should be 0 if page is after the total', () => {
            expect(expectedPageLength({ total: 100, page: 2, size: 50 })).toBe(0);
        });
    });
});
