import isFunction from './isFunction';

it('should return true for class', () => {
    const result = isFunction(class Any {});
    expect(result).toEqual(true);
});

it('should return true for function', () => {
    const result = isFunction(() => {});
    expect(result).toEqual(true);
});

it('should return true for generator ', () => {
    const result = isFunction(function* () {}); // eslint-disable-line @typescript-eslint/no-empty-function
    expect(result).toEqual(true);
});

it('should return false for non-functions', () => {
    expect(isFunction([1, 2, 3])).toEqual(false);
    expect(isFunction({ a: 1, b: 2, c: 3 })).toEqual(false);
    expect(isFunction(true)).toEqual(false);
});
