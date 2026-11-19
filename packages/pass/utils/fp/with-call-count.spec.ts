import { withCallCount } from './with-call-count';

const TEST_COUNT = 42;
const fn = withCallCount(vi.fn);

describe('withCallCount', () => {
    beforeAll(() => vi.useFakeTimers());
    afterAll(() => vi.useRealTimers());

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

    test('Should keep track of last call epoch in seconds', () => {
        vi.setSystemTime(new Date(0));
        fn();
        expect(fn.lastCalledAt).toEqual(0);

        vi.setSystemTime(new Date(1_000));
        fn();
        expect(fn.lastCalledAt).toEqual(1);
    });
});
