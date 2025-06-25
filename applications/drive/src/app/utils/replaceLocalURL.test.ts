import { replaceLocalURL } from './replaceLocalURL';

const replaceLocation = (href: string) => {
    window = Object.create(window);

    const url = new URL(href);

    Object.defineProperty(window, 'location', {
        value: {
            hostname: url.hostname,
            host: url.host,
        },
        writable: true, // possibility to override
    });
};

describe('replaceLocalURL', () => {
    const realLocation = window.location;

    afterEach(() => {
        // @ts-ignore
        window.location = realLocation;
    });

    describe('localhost', () => {
        beforeEach(() => {
            replaceLocation('https://localhost:8080/u/0');
        });

        it('should not replace local URLs', () => {
            const url = 'https://drive-api.proton.me/test';

            expect(replaceLocalURL(url)).toBe(url);
        });
    });

    describe('proton.me', () => {
        beforeEach(() => {
            replaceLocation('https://drive.proton.me/u/0');
        });

        it('should not replace local URLs', () => {
            const url = 'https://drive-api.proton.me/test';

            expect(replaceLocalURL(url)).toBe(url);
        });
    });

    describe('proton.dev', () => {
        beforeEach(() => {
            replaceLocation('https://drive.proton.dev/u/0');
        });

        [
            ['https://drive.proton.black/test', 'https://drive.proton.dev/test'],
            ['https://drive.env.proton.black/test', 'https://drive.proton.dev/test'],
            ['https://drive-api.proton.black/test', 'https://drive-api.proton.dev/test'],
            ['https://drive-api.env.proton.black/test', 'https://drive-api.proton.dev/test'],
        ].forEach((item) => {
            const input = item[0];
            const output = item[1];

            it(`${input} => ${output}`, () => {
                expect(replaceLocalURL(input)).toBe(output);
            });
        });
    });

    describe('proton.dev:8888', () => {
        beforeEach(() => {
            replaceLocation('https://drive.proton.dev:8888/u/0');
        });

        [
            ['https://drive.proton.black/test', 'https://drive.proton.dev:8888/test'],
            ['https://drive.env.proton.black/test', 'https://drive.proton.dev:8888/test'],
            ['https://drive-api.proton.black/test', 'https://drive-api.proton.dev:8888/test'],
            ['https://drive-api.env.proton.black/test', 'https://drive-api.proton.dev:8888/test'],
        ].forEach((item) => {
            const input = item[0];
            const output = item[1];

            it(`${input} => ${output}`, () => {
                expect(replaceLocalURL(input)).toBe(output);
            });
        });
    });
});
