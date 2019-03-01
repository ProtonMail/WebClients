import { describe, it } from 'mocha';
import assert from 'assert';
import requireInject from 'require-inject';

const mockRandomValues = (buf) =>
    new Uint8Array(
        Array(buf.length)
            .fill(0)
            .slice(0, buf.length)
    );

const mocks = {
    'get-random-values': mockRandomValues
};

const { getRandomString } = requireInject('../../lib/helpers/string', mocks);

describe('string', () => {
    it('should generate a random string of length 16', () => {
        const result = getRandomString(16);
        assert.strictEqual(result, 'AAAAAAAAAAAAAAAA');
    });
});
