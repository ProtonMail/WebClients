export const createSpy = (spiedFn) => {
    const calls = [];
    const returns = [];

    const fn = (...args) => {
        calls.push(args);
        if (!spiedFn) {
            return;
        }
        const spiedReturn = spiedFn(...args);
        returns.push(spiedReturn);
        return spiedReturn;
    };

    fn.calls = calls;
    fn.returns = returns;

    return fn;
};
