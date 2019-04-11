import { describe, it, beforeEach, afterEach } from 'mocha';
import assert from 'assert';
import performRequest from '../../lib/fetch/fetch';
import { createSpy } from '../spy';

class FormDataMock {
    constructor() {
        this.data = {};
    }

    append(name, key) {
        this.data[name] = key;
    }
}

describe('fetch', () => {
    let preFetch;
    let preFormData;

    beforeEach(() => {
        preFetch = global.fetch;
        preFormData = global.FormData;
        global.FormData = FormDataMock;
    });

    afterEach(() => {
        global.fetch = preFetch;
        global.FormData = preFormData;
    });

    const setup = (fn) => {
        const spy = createSpy(fn);
        global.fetch = spy;
        return spy;
    };

    it('should be able to receive json data', async () => {
        setup(async () => ({ json: async () => ({ bar: 1 }), status: 200 }));
        const config = {
            url: 'http://foo.com/'
        };
        const result = await performRequest(config);
        assert.deepStrictEqual(result, { bar: 1 });
    });

    it('should be able to receive blob data', async () => {
        setup(async () => ({ blob: async () => 123, status: 200 }));
        const config = {
            url: 'http://foo.com/',
            output: 'blob'
        };
        const result = await performRequest(config);
        assert.deepStrictEqual(result, 123);
    });

    it('should be able to send json data', async () => {
        const spy = setup(async () => ({ json: async () => ({ bar: 1 }), status: 200 }));
        const config = {
            url: 'http://foo.com/',
            data: {
                foo: 'bar'
            }
        };
        await performRequest(config);
        assert.deepStrictEqual(spy.calls[0], [
            new URL(config.url),
            {
                mode: 'cors',
                credentials: 'include',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config.data)
            }
        ]);
    });

    it('should be able to send form data', async () => {
        const spy = setup(async () => ({ json: async () => ({ bar: 1 }), status: 200 }));
        const config = {
            url: 'http://foo.com/',
            input: 'form',
            data: {
                foo: 'bar'
            }
        };
        await performRequest(config);
        const fd = new FormData();
        fd.append('foo', 'bar');
        assert.deepStrictEqual(spy.calls[0], [
            new URL(config.url),
            {
                mode: 'cors',
                credentials: 'include',
                redirect: 'follow',
                headers: {
                    'Content-Type': undefined
                },
                body: fd
            }
        ]);
    });

    it('should throw on 400 error and include the config, data and status', async () => {
        setup(async () => ({ json: async () => ({ bar: 1 }), status: 400 }));
        const config = {
            url: 'http://foo.com/',
            suppress: [123]
        };
        await assert.rejects(performRequest(config), {
            name: 'Error',
            message: '',
            status: 400,
            data: { bar: 1 },
            config: {
                suppress: [123],
                mode: 'cors',
                credentials: 'include',
                redirect: 'follow',
                headers: {},
                body: undefined
            }
        });
    });
});
