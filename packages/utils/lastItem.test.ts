import lastItem from './lastItem';

describe('lastItem()', () => {
    it('should return undefined when array is empty', () => {
        const result = lastItem([]);

        expect(result).toBe(undefined);
    });

    it('should return only item when array is of length 1', () => {
        const item = 'item';
        const result = lastItem([item]);

        expect(result).toBe(item);
    });

    it('should return last item when array is of length greater than 1', () => {
        const item = 'item';
        const result = lastItem(['1', '2', item]);

        expect(result).toBe(item);
    });
});
