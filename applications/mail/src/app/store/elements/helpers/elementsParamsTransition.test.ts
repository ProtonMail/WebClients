import type { Sort } from '@proton/shared/lib/mail/search';

import type { ParamsTransitionInput } from './elementsParamsTransition';
import { getParamsTransition } from './elementsParamsTransition';

const newestFirst: Sort = { sort: 'Time', desc: true };
const oldestFirst: Sort = { sort: 'Time', desc: false };

const getInput = (overrides: Partial<ParamsTransitionInput> = {}): ParamsTransitionInput => ({
    previous: {
        sort: newestFirst,
        searchKeyword: undefined,
        newsletterSubscriptionID: undefined,
    },
    next: {
        labelID: 'inbox',
        sort: newestFirst,
        searchKeyword: undefined,
        isSearching: false,
    },
    encryptedSearch: {
        esEnabled: false,
        previousEsEnabled: false,
        dbExists: false,
        previousDbExists: false,
    },
    pageIsConsecutive: true,
    page: 0,
    ...overrides,
});

describe('getParamsTransition', () => {
    it('only sets the params when nothing relevant changed', () => {
        expect(getParamsTransition(getInput())).toBe('setParams');
    });

    describe('sort', () => {
        it('resets when the sort field changes', () => {
            const input = getInput({
                next: {
                    ...getInput().next,
                    sort: { sort: 'Size', desc: true },
                },
            });
            expect(getParamsTransition(input)).toBe('reset');
        });

        it('resets when the sort direction changes', () => {
            const input = getInput({
                next: { ...getInput().next, sort: oldestFirst },
            });
            expect(getParamsTransition(input)).toBe('reset');
        });

        it('does not reset when the sort is the same', () => {
            const input = getInput({
                previous: { ...getInput().previous, sort: oldestFirst },
                next: { ...getInput().next, sort: { ...oldestFirst } },
            });
            expect(getParamsTransition(input)).toBe('setParams');
        });
    });

    describe('page', () => {
        it('resets on a page jump', () => {
            expect(getParamsTransition(getInput({ pageIsConsecutive: false, page: 4 }))).toBe('reset');
        });

        it('does not reset on a consecutive page', () => {
            expect(getParamsTransition(getInput({ pageIsConsecutive: true, page: 1 }))).toBe('setParams');
        });
    });

    describe('search keyword', () => {
        it('resets when the keyword is set', () => {
            const input = getInput({
                next: {
                    ...getInput().next,
                    searchKeyword: 'hello',
                    isSearching: true,
                },
            });
            expect(getParamsTransition(input)).toBe('reset');
        });

        it('resets when the keyword is removed', () => {
            const input = getInput({
                previous: { ...getInput().previous, searchKeyword: 'hello' },
            });
            expect(getParamsTransition(input)).toBe('reset');
        });

        it('does not reset when the keyword is the same', () => {
            const input = getInput({
                previous: { ...getInput().previous, searchKeyword: 'hello' },
                next: {
                    ...getInput().next,
                    searchKeyword: 'hello',
                    isSearching: true,
                },
            });
            expect(getParamsTransition(input)).toBe('setParams');
        });
    });

    describe('encrypted search', () => {
        const searching = {
            ...getInput().next,
            searchKeyword: 'hello',
            isSearching: true,
        };
        const searchingPrevious = {
            ...getInput().previous,
            searchKeyword: 'hello',
        };

        it('resets when esEnabled changes during a search', () => {
            const input = getInput({
                previous: searchingPrevious,
                next: searching,
                encryptedSearch: {
                    esEnabled: true,
                    previousEsEnabled: false,
                    dbExists: false,
                    previousDbExists: false,
                },
            });
            expect(getParamsTransition(input)).toBe('reset');
        });

        it('resets when only dbExists changes during a search', () => {
            const input = getInput({
                previous: searchingPrevious,
                next: searching,
                encryptedSearch: {
                    esEnabled: true,
                    previousEsEnabled: true,
                    dbExists: true,
                    previousDbExists: false,
                },
            });
            expect(getParamsTransition(input)).toBe('reset');
        });

        it('ignores an encrypted search change when not searching', () => {
            const input = getInput({
                encryptedSearch: {
                    esEnabled: true,
                    previousEsEnabled: false,
                    dbExists: true,
                    previousDbExists: false,
                },
            });
            expect(getParamsTransition(input)).toBe('setParams');
        });

        it('goes to the first page before resetting when not on the first page', () => {
            const input = getInput({
                previous: searchingPrevious,
                next: searching,
                page: 2,
                encryptedSearch: {
                    esEnabled: true,
                    previousEsEnabled: false,
                    dbExists: false,
                    previousDbExists: false,
                },
            });
            expect(getParamsTransition(input)).toBe('goToFirstPage');
        });

        it('goes to the first page even in the newsletter view', () => {
            const input = getInput({
                previous: {
                    ...searchingPrevious,
                    newsletterSubscriptionID: 'sub',
                },
                next: searching,
                page: 2,
                encryptedSearch: {
                    esEnabled: true,
                    previousEsEnabled: false,
                    dbExists: false,
                    previousDbExists: false,
                },
            });
            expect(getParamsTransition(input)).toBe('goToFirstPage');
        });
    });

    describe('newsletter view', () => {
        const previous = {
            ...getInput().previous,
            newsletterSubscriptionID: 'sub',
        };

        it('does not reset on sort change', () => {
            const input = getInput({
                previous,
                next: { ...getInput().next, sort: oldestFirst },
            });
            expect(getParamsTransition(input)).toBe('setParams');
        });

        it('does not reset on page jump', () => {
            expect(getParamsTransition(getInput({ previous, pageIsConsecutive: false }))).toBe('setParams');
        });

        it('does not reset on encrypted search change', () => {
            const input = getInput({
                previous,
                next: {
                    ...getInput().next,
                    searchKeyword: undefined,
                    isSearching: true,
                },
                encryptedSearch: {
                    esEnabled: true,
                    previousEsEnabled: false,
                    dbExists: false,
                    previousDbExists: false,
                },
            });
            expect(getParamsTransition(input)).toBe('setParams');
        });

        it('still resets when the search keyword changes', () => {
            const input = getInput({
                previous,
                next: {
                    ...getInput().next,
                    searchKeyword: 'hello',
                    isSearching: true,
                },
            });
            expect(getParamsTransition(input)).toBe('reset');
        });

        it('resets on sort change when there is no label (leaving the newsletter view)', () => {
            const input = getInput({
                previous,
                next: {
                    ...getInput().next,
                    labelID: undefined,
                    sort: oldestFirst,
                },
            });
            expect(getParamsTransition(input)).toBe('reset');
        });
    });
});
