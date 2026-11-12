import { setLocation } from '@proton/jest-env/setLocation';

import { replaceLocalURL } from './replaceLocalURL';

describe('replaceLocalURL', () => {
    describe('localhost', () => {
        beforeEach(() => {
            setLocation('https://localhost:8080/u/0');
        });

        it('should not replace local URLs', () => {
            const url = 'https://drive-api.proton.me/test';

            expect(replaceLocalURL(url)).toBe(url);
        });
    });

    describe('proton.me', () => {
        beforeEach(() => {
            setLocation('https://drive.proton.me/u/0');
        });

        it('should not replace local URLs', () => {
            const url = 'https://drive-api.proton.me/test';

            expect(replaceLocalURL(url)).toBe(url);
        });
    });

    describe('proton.dev', () => {
        beforeEach(() => {
            setLocation('https://drive.proton.dev/u/0');
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
            setLocation('https://drive.proton.dev:8888/u/0');
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
