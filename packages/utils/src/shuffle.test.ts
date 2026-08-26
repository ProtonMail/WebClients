import shuffle from './shuffle';

describe('shuffle()', () => {
    it('returns empty array when empty array is passed', () => {
        const result = shuffle([]);

        expect(result).toStrictEqual([]);
    });

    it('returns same array when array of length 1 is passed', () => {
        const input = [0];

        const result = shuffle(input);

        expect(result).toStrictEqual(input);
    });

    it('return array of same length', () => {
        const input = [0, 1, 2, 3, 4, 5, 6];

        const result = shuffle(input);

        expect(result.length).toBe(input.length);
    });

    it('does not mutate items in the array', () => {
        const input = [0, 1, 2, 3, 4, 5, 6];

        const result = shuffle(input);

        expect(result.sort()).toStrictEqual(input.sort());
    });

    it('shuffles as expected when random values are mocked', () => {
        jest.spyOn(Math, 'random')
            .mockReturnValueOnce(0.8824154514152932)
            .mockReturnValueOnce(0.22451795440520217)
            .mockReturnValueOnce(0.5352346169904075)
            .mockReturnValueOnce(0.9121122157867988)
            .mockReturnValueOnce(0.008603728182251968)
            .mockReturnValueOnce(0.26845647050651644)
            .mockReturnValueOnce(0.44258055272215036)
            .mockReturnValueOnce(0.08296662925946618)
            .mockReturnValueOnce(0.4341574602173227);
        const input = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        const result = shuffle(input);

        expect(result).toStrictEqual([3, 9, 5, 7, 1, 0, 6, 4, 2, 8]);
    });

    describe('when array is of length 2', () => {
        it('swaps items when random value is < 0.5', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.49);
            const input = [0, 1];

            const result = shuffle(input);

            expect(result).toStrictEqual([1, 0]);
        });

        it('does not swap items when random value is = 0.5', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.5);
            const input = [0, 1];

            const result = shuffle(input);

            expect(result).toStrictEqual(input);
        });

        it('does not swap items when random value is > 0.5', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.51);
            const input = [0, 1];

            const result = shuffle(input);

            expect(result).toStrictEqual(input);
        });
    });
});
