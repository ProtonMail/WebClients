import { isErrorDueToNameConflict } from './isErrorDueToNameConflict';

describe('isErrorDueToNameConflict', () => {
    it('Should return true if error is for a name conflict', () => {
        expect(isErrorDueToNameConflict({ status: 422, data: { Code: 2500 } })).toEqual(true);
    });
    it('Should return false  if error is not a name conflict', () => {
        expect(isErrorDueToNameConflict({ status: 418, data: { Code: 2500 } })).toEqual(false);
        expect(isErrorDueToNameConflict({ status: 422, data: { Code: 1 } })).toEqual(false);
        expect(isErrorDueToNameConflict(undefined)).toEqual(false);
        expect(isErrorDueToNameConflict(true)).toEqual(false);
        expect(isErrorDueToNameConflict(12)).toEqual(false);
        expect(isErrorDueToNameConflict('test')).toEqual(false);
        expect(isErrorDueToNameConflict({})).toEqual(false);
    });
});
