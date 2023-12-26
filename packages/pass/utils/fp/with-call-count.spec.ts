import { withCallCount } from './with-call-count';

const TEST_COUNT = 42;
const fn = withCallCount(jest.fn);

describe('withCallCount', () => {
    test('Should keep track of number of calls', () => {
        expect(fn.callCount).toEqual(0);
        let count = TEST_COUNT;

        while (count > 0) {
            fn();
            count -= 1;
        }

        expect(fn.callCount).toEqual(TEST_COUNT);
    });

    test('Should reset internal count', () => {
        fn.resetCount();
        expect(fn.callCount).toEqual(0);
    });
});
