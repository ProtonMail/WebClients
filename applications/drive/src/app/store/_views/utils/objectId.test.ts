import { getArrayIdNoMatterTheOrder, getObjectId } from './objectId';

describe('objectsId', () => {
    const object1 = { a: 1 };
    const object2 = { a: 1 };
    const object3 = { a: 1 };
    const array12 = [object1, object2];
    const array13 = [object1, object3];
    const array21 = [object2, object1];

    it('getObjectId should return different ID for different object', () => {
        const id1 = getObjectId(object1);
        const id2 = getObjectId(object2);
        expect(id1).not.toBe(id2);
    });

    it('getObjectId should return the same ID for the same object', () => {
        const id1 = getObjectId(object1);
        const id2 = getObjectId(object1);
        expect(id1).toBe(id2);
    });

    it('getArrayIdNoMatterTheOrder should return different ID for different array containing different elements', () => {
        const id1 = getArrayIdNoMatterTheOrder(array12);
        const id2 = getArrayIdNoMatterTheOrder(array13);
        expect(id1).not.toBe(id2);
    });

    it('getArrayIdNoMatterTheOrder should return the same ID for different array containing the same elements no matter the order', () => {
        const id1 = getArrayIdNoMatterTheOrder(array12);
        const id2 = getArrayIdNoMatterTheOrder(array21);
        expect(id1).toBe(id2);
    });
});
