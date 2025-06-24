import { safeMatch, safeQuery } from './popover';

describe('`safeMatch`', () => {
    let el: HTMLElement;

    beforeEach(() => {
        el = document.createElement('div');
        el.className = 'test-class';
    });

    test('should return `true` when element matches selector', () => {
        const result = safeMatch(el, '.test-class');
        expect(result).toBe(true);
    });

    test('should return `false` when element does not match selector', () => {
        const result = safeMatch(el, '.other-class');
        expect(result).toBe(false);
    });

    test('should return `false` when `matches()` throws [Firefox ESR 115 regression]', () => {
        jest.spyOn(el, 'matches').mockImplementation(() => {
            throw new Error();
        });

        const result = safeMatch(el, '.test-class');
        expect(result).toBe(false);
    });
});

describe('`safeQuery`', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div class="test-item"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('should return array of matching elements', () => {
        const result = safeQuery('.test-item');
        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(HTMLElement);
    });

    test('should return empty array when no elements match', () => {
        const result = safeQuery('.non-existent');
        expect(result).toEqual([]);
    });

    test('should return empty array when querySelectorAll throws', () => {
        jest.spyOn(document, 'querySelectorAll').mockImplementation(() => {
            throw new Error();
        });

        const result = safeQuery('.test-item');
        expect(result).toEqual([]);
    });
});
