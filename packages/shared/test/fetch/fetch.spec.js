import performRequest from '../../lib/fetch/fetch';

class FormDataMock {
    constructor() {
        this.data = {};
    }

    append(name, key) {
        this.data[name] = key;
    }
}

const headersMock = {
    get: () => {
        return undefined;
    },
};

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
        const spy = jasmine.createSpy('fetch').and.callFake(fn);
        global.fetch = spy;
        return spy;
    };

    it('should be able to receive json data', async () => {
        setup(async () => ({ json: async () => ({ bar: 1 }), status: 200, headers: headersMock }));
        const config = {
            url: 'http://foo.com/',
        };
        const result = await performRequest(config).then((response) => response.json());
        expect(result).toEqual({ bar: 1 });
    });

    it('should be able to receive blob data', async () => {
        setup(async () => ({ blob: async () => 123, status: 200, headers: headersMock }));
        const config = {
            url: 'http://foo.com/',
            output: 'blob',
        };
        const result = await performRequest(config).then((response) => response.blob());
        expect(result).toEqual(123);
    });

    it('should be able to send json data', async () => {
        const spy = setup(async () => ({ json: async () => ({ bar: 1 }), status: 200, headers: headersMock }));
        const config = {
            url: 'http://foo.com/',
            data: {
                foo: 'bar',
            },
        };
        await performRequest(config).then((response) => response.json());
        expect(spy.calls.all()[0].args).toEqual([
            new URL(config.url),
            jasmine.objectContaining({
                mode: 'cors',
                credentials: 'include',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config.data),
            }),
        ]);
    });

    it('should be able to send form data', async () => {
        const spy = setup(async () => ({ json: async () => ({ bar: 1 }), status: 200, headers: headersMock }));
        const config = {
            url: 'http://foo.com/',
            input: 'form',
            data: {
                foo: 'bar',
            },
        };
        await performRequest(config).then((response) => response.json());
        const fd = new FormData();
        fd.append('foo', 'bar');
        expect(spy.calls.all()[0].args).toEqual([
            new URL(config.url),
            jasmine.objectContaining({
                mode: 'cors',
                credentials: 'include',
                redirect: 'follow',
                headers: {},
                body: fd,
            }),
        ]);
    });

    it('should throw on 400 error and include the config, data and status', async () => {
        setup(async () => ({ json: async () => ({ bar: 1 }), status: 400, headers: headersMock }));
        const config = {
            url: 'http://foo.com/',
            suppress: [123],
        };
        await expectAsync(performRequest(config)).toBeRejectedWith(
            jasmine.objectContaining({
                name: 'StatusCodeError',
                message: '',
                status: 400,
                data: { bar: 1 },
                config: jasmine.objectContaining({
                    suppress: [123],
                    mode: 'cors',
                    credentials: 'include',
                    redirect: 'follow',
                    headers: {},
                    body: undefined,
                }),
            })
        );
    });
});
