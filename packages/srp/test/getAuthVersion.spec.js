import { describe, it } from 'mocha';
import assert from 'assert';

import './setup';
import getAuthVersionWithFallback from '../lib/getAuthVersionWithFallback';

describe('auth version fallback', () => {
    for (let i = 1; i <= 4; ++i) {
        it(`should get specified auth version ${i}`, () => {
            const result = getAuthVersionWithFallback({ Version: 4 });
            assert.deepStrictEqual(result, {
                version: 4,
                done: true
            });
        });
    }

    it('should get specified auth version if a version has been attempted', () => {
        const result = getAuthVersionWithFallback({ Version: 4 }, '', 2);
        assert.deepStrictEqual(result, {
            version: 4,
            done: true
        });
    });

    it('should fall back to auth version 2 when it is unknown', () => {
        const result = getAuthVersionWithFallback({ Version: 0 });
        assert.deepStrictEqual(result, {
            version: 2,
            done: false
        });
    });

    it('should fall back to auth version 1 when it has attempted 2 and the username contains underscore', () => {
        const result = getAuthVersionWithFallback({ Version: 0 }, 'test_100', 2);
        assert.deepStrictEqual(result, {
            version: 1,
            done: false
        });
    });

    it('should fall back to auth version 0 when it has attempted 2', () => {
        const result = getAuthVersionWithFallback({ Version: 0 }, '', 2);
        assert.deepStrictEqual(result, {
            version: 0,
            done: true
        });
    });

    it('should throw when all attempts have been made', () => {
        assert.throws(
            () => {
                getAuthVersionWithFallback({ Version: 0 }, '', 0);
            },
            {
                name: 'Error',
                message: 'Can not provide any other auth version'
            }
        );
    });
});
