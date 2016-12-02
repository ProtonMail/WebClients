const assert = (value) => (test) => expect(test).toEqual(value);
const isTrue = assert(true);
const isFalse = assert(false);

module.exports = { assert, isTrue, isFalse };
