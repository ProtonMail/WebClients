import { protonFetch } from '../../lib/fetch/fetch';
import type { FetchConfig } from '../../lib/fetch/interface';

class FormDataMockClass {
    data: { [key: string]: any };

    constructor() {
        this.data = {};
    }

    append(key: string, value: any) {
        this.data[key] = value;
    }
}

const FormDataMock = FormDataMockClass as unknown as typeof FormData;

const headersMock = {
    get: () => {
        return undefined;
    },
};

describe('fetch', () => {
    let preFetch: typeof fetch;
    let preFormData: typeof FormData;

    beforeEach(() => {
        preFetch = globalThis.fetch;
        preFormData = globalThis.FormData;
        globalThis.FormData = FormDataMock;
    });

    afterEach(() => {
        globalThis.fetch = preFetch;
        globalThis.FormData = preFormData;
    });

    const setup = (fn: any) => {
        const spy = vi.fn(fn);
        globalThis.fetch = spy as unknown as typeof fetch;
        return spy;
    };

    it('should be able to receive json data', async () => {
        setup(async () => ({ json: async () => ({ bar: 1 }), status: 200, headers: headersMock }));
        const config: FetchConfig = {
            url: 'http://foo.com/',
        };
        const result = await protonFetch(config).then((response) => response.json());
        expect(result).toEqual({ bar: 1 });
    });

    it('should be able to receive blob data', async () => {
        const blob = new Blob(['test']);
        setup(async () => ({ blob: async () => blob, status: 200, headers: headersMock }));
        const config: FetchConfig = {
            url: 'http://foo.com/',
            output: 'blob',
        };
        const result = await protonFetch(config).then((response) => response.blob());
        expect(result).toEqual(blob);
    });

    it('should be able to send json data', async () => {
        const spy = setup(async () => ({ json: async () => ({ bar: 1 }), status: 200, headers: headersMock }));
        const config: FetchConfig = {
            url: 'http://foo.com/',
            data: {
                foo: 'bar',
            },
        };
        await protonFetch(config).then((response) => response.json());
        expect(spy.mock.calls[0]).toEqual([
            new URL(config.url),
            expect.objectContaining({
                mode: 'cors',
                credentials: 'include',
                redirect: 'follow',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify(config.data),
            }),
        ]);
    });

    it('should be able to send form data', async () => {
        const spy = setup(async () => ({ json: async () => ({ bar: 1 }), status: 200, headers: headersMock }));
        const config: FetchConfig = {
            url: 'http://foo.com/',
            input: 'form',
            data: {
                foo: 'bar',
            },
        };
        await protonFetch(config).then((response) => response.json());
        const fd = new FormData();
        fd.append('foo', 'bar');
        expect(spy.mock.calls[0]).toEqual([
            new URL(config.url),
            expect.objectContaining({
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
        const config: FetchConfig = {
            url: 'http://foo.com/',
            suppress: [123],
        };
        await expect(protonFetch(config)).rejects.toEqual(
            expect.objectContaining({
                name: 'StatusCodeError',
                message: '',
                status: 400,
                data: { bar: 1 },
                config: {
                    url: 'http://foo.com/',
                    suppress: [123],
                    params: undefined,
                    headers: {},
                    body: undefined,
                },
            })
        );
    });
});
