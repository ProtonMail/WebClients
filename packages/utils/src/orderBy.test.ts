import orderBy from './orderBy';

describe('orderBy()', () => {
    it('orders an array of objects by the numeric value of a given property of the objects in the array', () => {
        const arrayOfObjects = [{ id: 7 }, { id: 3 }, { id: 3 }, { id: 6 }, { id: 18 }, { id: 2 }];

        const output = orderBy(arrayOfObjects, 'id');

        const expected = [{ id: 2 }, { id: 3 }, { id: 3 }, { id: 6 }, { id: 7 }, { id: 18 }];

        expect(output).toEqual(expected);
    });
});
