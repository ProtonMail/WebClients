const assert = (value) => (test) => expect(test).toEqual(value);
const isTrue = assert(true);
const isFalse = assert(false);
const greaterThan = (value) => (test) => expect(test).toBeGreaterThan(value);
const lessThan = (value) => (test) => expect(test).toBeLessThan(value);
const assertUrl = (value) => () => expect(browser.getCurrentUrl()).toContain(value);

module.exports = {
    assert, assertUrl,
    isTrue, isFalse,
    greaterThan, lessThan
};
