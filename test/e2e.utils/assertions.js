const assert = (value) => (test) => expect(test).toEqual(value);
const isTrue = assert(true);
const isFalse = assert(false);
const greaterThan = (value) => (test) => expect(test).toBeGreaterThan(value);
const lessThan = (value) => (test) => expect(test).toBeLessThan(value);
const assertUrl = (value) => () => expect(browser.getCurrentUrl()).toContain(value);
const contains = (testCb) => (test) => assert(test.some(testCb))(true);

module.exports = {
    assert, assertUrl, contains,
    isTrue, isFalse,
    greaterThan, lessThan
};
